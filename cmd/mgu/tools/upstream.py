"""Load upstream tools with local paths; retain no upstream implementation here."""
import argparse
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
LOCAL_APPS = {'mgu_lab', 'ambient_lighting', 'live_data_viewer', 'trip_data'}


def load_tool(upstream, name):
    directory = upstream / 'kit' / 'tools'
    sys.path.insert(0, str(directory))
    spec = importlib.util.spec_from_file_location('hollows_' + name, directory / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def data_path(base, name):
    target = (base / name).resolve()
    if target == base.resolve() or base.resolve() not in target.parents:
        raise ValueError('App data path escapes its directory: ' + name)
    return target


def copy_app_data(source, target, spec):
    if not source.exists():
        return
    allowed = {'icon.png', 'doom.wasm', 'dtc_texts.js', 'dtc_db', 'dtc_db.pack'}
    allowed.update(item['file'] for item in spec.get('assets', []))
    for item in source.iterdir():
        if item.name not in allowed:
            raise ValueError('Unexpected app source override: ' + str(item))
        destination = target / item.name
        if item.is_dir():
            # The upstream packer reads unpacked data in preference to its .pack file.
            if destination.exists():
                shutil.rmtree(destination)
            shutil.copytree(item, destination)
        else:
            shutil.copy2(item, destination)


class RuntimeOverlay:
    def __init__(self, root, upstream, enabled):
        self.root = root
        self.runtime = upstream / 'kit' / 'runtime'
        self.enabled = enabled
        self.patches = json.loads((root / 'cmd' / 'mgu' / 'patches' / 'runtime.json').read_text(encoding='utf-8'))

    def __getattr__(self, name):
        return getattr(shutil, name)

    def copy(self, source, destination, *args, **kwargs):
        source = Path(source)
        edits = [item for item in self.patches if source == self.runtime / item['file']] if self.enabled else []
        if not edits:
            return shutil.copy(source, destination, *args, **kwargs)
        text = source.read_text(encoding='utf-8')
        for edit in edits:
            before = edit['old'].replace('\r\n', '\n')
            after = edit['new'].replace('\r\n', '\n')
            if text.count(before) != 1:
                raise RuntimeError('Upstream changed; runtime patch needs review: ' + edit['file'])
            text = text.replace(before, after, 1)
        destination = Path(destination)
        destination.write_bytes(text.encode('utf-8'))
        if source.name == 'mgu.js':
            shutil.copy2(self.root / 'cmd' / 'mgu' / 'extensions' / 'runtime' / 'setting_units.js', destination.parent / 'setting_units.js')
        return str(destination)


def build(args):
    module = load_tool(args.upstream, 'build')
    source = (args.root if args.app in LOCAL_APPS else args.upstream) / 'apps' / args.app
    spec = json.loads((source / 'app.json').read_text(encoding='utf-8'))
    spec.setdefault('id', args.app)
    module.ROOT = str(args.root)
    module.DIST = str(args.root / 'dist')
    module.SDK = str(args.root / 'bmw-extracted' / 'oap-sdk')
    module.KIT = str(args.upstream / 'kit')
    module.shutil = RuntimeOverlay(args.root, args.upstream, args.app in LOCAL_APPS)
    (args.root / 'out').mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='mgu-source-', dir=str(args.root / 'out')) as work:
        apps = Path(work) / 'apps'
        app = apps / args.app
        app.parent.mkdir(parents=True)
        shutil.copytree(source, app)
        if args.app not in LOCAL_APPS:
            copy_app_data(args.root / 'apps' / args.app, app, spec)
        copy_app_data(args.root / 'bmw-extracted' / args.app, app, spec)
        module.APPS = str(apps)
        original_fetch = module.fetch_assets

        def fetch_assets(directory, assets):
            original_fetch(directory, assets)
            cache = args.root / 'apps' / args.app
            for asset in assets:
                destination = data_path(cache, asset['file'])
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(data_path(Path(directory), asset['file']), destination)

        def make_icon(icon_spec, output):
            icon = app / 'icon.png'
            if icon.exists():
                shutil.copy2(icon, output)
            else:
                subprocess.run([args.node, str(args.upstream / 'kit' / 'tools' / 'make_icon.js'),
                                icon_spec.get('iconGlyph', icon_spec['title'][:2]), output], check=True)

        module.fetch_assets = fetch_assets
        module.make_icon = make_icon
        module.build(args.app)


def renderer_path(args, mode):
    if mode == 'none':
        return None
    module = load_tool(args.upstream, 'make_kit')
    want = module.source_hash()
    for directory in [args.root / 'out' / 'renderer', args.upstream / 'kit' / 'renderd' / 'prebuilt']:
        binary = directory / 'mgu-renderd'
        gate = directory / 'mgu-inputgate.so'
        if not binary.is_file() or not gate.is_file():
            continue
        checksum = directory / 'SOURCE_SHA256'
        fields = checksum.read_text(encoding='utf-8').split() if checksum.exists() else []
        if mode == 'stale' or (fields and fields[0] == want):
            if mode == 'stale':
                print('Using renderer without requiring a source match: ' + str(binary), file=sys.stderr)
            return str(binary)
    raise RuntimeError('No matching upstream renderer; use renderer build, kit --renderer stale, or kit --renderer none')


def renderer(args):
    module = load_tool(args.upstream, 'make_kit')
    want = module.source_hash()
    if args.operation == 'status':
        print('source:', want)
        print('matching prebuilt:', renderer_path(args, 'matching'))
        return
    output = args.root / 'out'
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='mgu-renderer-', dir=str(output)) as work:
        directory = Path(work) / 'renderd'
        shutil.copytree(args.upstream / 'kit' / 'renderd', directory)
        module.RENDERD = str(directory)
        module.BUILT = str(directory / 'build' / 'mgu-renderd')
        ok, log = module.docker_build()
        print(log, end='')
        if not ok:
            raise RuntimeError('Upstream renderer build failed')
        module.RENDERD = str(args.upstream / 'kit' / 'renderd')
        if module.source_hash() != want:
            raise RuntimeError('Upstream renderer source changed during build; output not published')
        prebuilt = output / 'renderer'
        prebuilt.mkdir(parents=True, exist_ok=True)
        for name in ['mgu-renderd', 'mgu-inputgate.so']:
            shutil.copy2(directory / 'build' / name, prebuilt / name)
        (prebuilt / 'SOURCE_SHA256').write_text(want + '\n', encoding='utf-8')
        print('Renderer output:', prebuilt)


def kit(args):
    module = load_tool(args.upstream, 'make_kit')
    selected = renderer_path(args, args.renderer)
    output = args.root / 'out'
    output.mkdir(parents=True, exist_ok=True)

    class BuildProcess:
        @staticmethod
        def run(command, **kwargs):
            if len(command) != 5 or Path(command[1]).name != 'build.py' or command[2:4] != ['--language', 'en'] or command[-1] not in args.apps:
                raise RuntimeError('Upstream kit build interface changed; adapter needs review')
            build(argparse.Namespace(root=args.root, upstream=args.upstream, node=args.node, app=command[-1]))
            return subprocess.CompletedProcess(command, 0)

    with tempfile.TemporaryDirectory(prefix='mgu-kit-', dir=str(output)) as work:
        # The kit tool reads manifests here; implementation stays in upstream.
        for app in args.apps:
            source = (args.root if app in LOCAL_APPS else args.upstream) / 'apps' / app / 'app.json'
            destination = Path(work) / 'apps' / app / 'app.json'
            destination.parent.mkdir(parents=True)
            shutil.copy2(source, destination)
        module.ROOT = work
        module.DIST = str(args.root / 'dist')
        module.DEPLOY = str(args.upstream / 'deploy')
        module.pick_renderer = lambda: selected
        module.subprocess = BuildProcess()
        previous = sys.argv
        try:
            sys.argv = [str(args.upstream / 'kit' / 'tools' / 'make_kit.py')] + args.apps
            module.main()
        finally:
            sys.argv = previous

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--upstream', type=Path, required=True)
    parser.add_argument('--node', default='node')
    commands = parser.add_subparsers(dest='command', required=True)
    build_parser = commands.add_parser('build')
    build_parser.add_argument('app')
    commands.add_parser('fonts')
    kit_parser = commands.add_parser('kit')
    kit_parser.add_argument('--renderer', choices=['matching', 'stale', 'none'], default='matching')
    kit_parser.add_argument('apps', nargs='+')
    renderer_parser = commands.add_parser('renderer')
    renderer_parser.add_argument('operation', choices=['status', 'build'])
    path_parser = commands.add_parser('renderer-path')
    path_parser.add_argument('mode', choices=['matching', 'stale', 'none'])
    args = parser.parse_args()
    args.root = args.root.resolve()
    args.upstream = args.upstream.resolve()
    if args.command == 'build':
        build(args)
    elif args.command == 'kit':
        kit(args)
    elif args.command == 'renderer':
        renderer(args)
    elif args.command == 'renderer-path':
        print(renderer_path(args, args.mode) or '')
    elif args.command == 'fonts':
        module = load_tool(args.upstream, 'bake_fonts')
        module.OUT = str(args.root / 'out' / 'fonts')
        module.main()


if __name__ == '__main__':
    main()
