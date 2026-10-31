 ### Install MGU Store

 You need:
 - Node.js 18+ and the OpenSSH client on your computer.
 - Existing root SSH access to the head unit.
 - Your computer connected by ENET or the car’s Wi-Fi hotspot, plus internet access to download the release.
 - The car parked, awake and on stable power throughout installation.

 From this project’s folder, run this in PowerShell, assuming .\id_rsa is your head unit’s root SSH key:

 ```powershell
node ..\mgu-store\deploy\mgu-install.js first-install --identity .\id_rsa
 ```

 It automatically tries the hotspot, then ENET. If discovery fails, specify the head unit’s address—for example, on the car’s hotspot:

 ```powershell
node ..\mgu-store\deploy\mgu-install.js first-install --identity .\id_rsa --host 172.16.222.97
 ```

 This uses the installer from your sibling checkout, but downloads the published Store release from GitHub—not your local app sources. It installs the Store and supporting components, including the updater,
 renderer and internet uplink by default.

 When prompted, restart the head unit to finish setup. The Store tile should then appear among the car’s apps.
 