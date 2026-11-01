#!/usr/bin/env python3
"""Build a Store package using the head unit's SDK and pinned upstream tooling."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import sys
import tarfile
import tempfile
from urllib.request import Request, urlopen

sys.dont_write_bytecode = True
import upstream

UPSTREAM_COMMIT = '9b5e9cf8a49399939d51d3458fb29b6a3cec8346'
UPSTREAM_SHA256 = '153634148de77dfa88b21a3c7d9c1afd6d27ad528f932f79f98666e02dfeb150'
UPSTREAM_URL = ('https://codeload.github.com/cauliflowermossgrape/idrive7-apps/tar.gz/'
                + UPSTREAM_COMMIT)


def fetch_upstream(work):
    archive = work / 'upstream.tar.gz'
    digest = hashlib.sha256()
    request = Request(UPSTREAM_URL, headers={'User-Agent': 'id7-hollows-apps-store-build'})
    print('Downloading upstream build tools at ' + UPSTREAM_COMMIT, flush=True)
    with urlopen(request, timeout=60) as response, archive.open('wb') as target:
        while True:
            block = response.read(1024 * 1024)
            if not block:
                break
            digest.update(block)
            target.write(block)
    if digest.hexdigest() != UPSTREAM_SHA256:
        raise RuntimeError('Upstream source archive checksum does not match the pinned revision')

    destination = work / 'upstream'
    prefix = 'idrive7-apps-' + UPSTREAM_COMMIT + '/'
    directories = (('kit', 'tools'), ('kit', 'runtime'), ('kit', 'platform'))
    with tarfile.open(archive, 'r:gz') as source:
        for member in source:
            if member.name == prefix[:-1] and member.isdir():
                continue
            if not member.name.startswith(prefix):
                raise RuntimeError('Unexpected upstream archive root: ' + member.name)
            relative = PurePosixPath(member.name[len(prefix):])
            if relative.is_absolute() or '..' in relative.parts:
                raise RuntimeError('Unsafe upstream archive path: ' + member.name)
            if (relative.parts[:2] not in directories
                    and str(relative) != 'apps/car_vitals/demo.js'):
                continue
            if member.isdir():
                continue
            if not member.isfile():
                raise RuntimeError('Unsupported upstream archive entry: ' + member.name)
            target = destination.joinpath(*relative.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with source.extractfile(member) as content, target.open('wb') as output:
                shutil.copyfileobj(content, output)
    archive.unlink()
    return destination


def main():
    root = Path(__file__).resolve().parents[3]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('app', choices=sorted(
        path.name for path in (root / 'apps').iterdir() if (path / 'app.json').is_file()))
    args = parser.parse_args()
    if not os.environ.get('MGU_OUT'):
        parser.error('MGU_OUT must be set by the MGU Store build environment')
    output = Path(os.environ['MGU_OUT']).resolve()
    node = shutil.which('node')
    if not node:
        parser.error('The MGU Store build environment must provide Node.js')
    sdk = root / 'bmw-extracted' / 'oap-sdk'
    if not all((sdk / name).is_file() for name in ('index.js', 'package.json')):
        parser.error('The MGU Store must inject the head unit SDK at bmw-extracted/oap-sdk')
    spec = json.loads((root / 'apps' / args.app / 'app.json').read_text(encoding='utf-8'))
    if spec.get('id', args.app) != args.app:
        parser.error('App ID must match its directory name')

    with tempfile.TemporaryDirectory(prefix='mgu-store-upstream-') as temporary:
        tooling = fetch_upstream(Path(temporary))
        upstream.build(argparse.Namespace(root=root, upstream=tooling, node=node, app=args.app))
        package = root / 'dist' / (args.app + '@' + spec['version'] + '.tgz')
        shutil.copyfile(package, output / package.name)
        print('Store package: ' + str(output / package.name), flush=True)


if __name__ == '__main__':
    main()
