# random
- that dark red replaced with teal was the red warning light - swap teal and red
- make my own cluster
- make my own widgets
- my own custom pfp? - bmw app? brandon could do it
- change the notification style pop up?

# research items
I have some deep research items in ideas.md, i want you to take a look at the "" and do a deep research for it using reverse engineer anything. 

this is the data available to look through:
- the full mgu headunit storage is in out/downloads
- other data related items are in this project folder as well
- ista is fully installed with a full dataset for all coding options, so you can look through this
- esys is also installed with a bunch of data, also useful to look through this
- anything else you may find, try your best

the goal is to read what I wrote and make a markdown file outlining your findings, then after that create a lab app that specifically tests your findings, so it can be refined and polished later but debugged initially  

## phone connection
- can I access phone connection? bluetooth?
- can the car get wifi?
- can it connect to my uniden r8?

## how complex can I add games?
- games like pacman, super mario, etc should be easy...
- what about apks? clash of clans, fallout shelter, factorio?
- games to add - 

## map switching
- determine how bm3 handles map switching for other cars, see if I can reproduce on my dme
- make app to switch between maps

## full exterior light control - check https://github.com/eroobeeroo/idrive7-apps/tree/main/apps/light_show
- be able to turn off headlights completely while car is running
- change lights while going faster than currently can

## ambient default profiles
- change the name and display of these posible?


# commands
go build -buildvcs=false -o out/mgu.exe ./cmd/mgu

./out/mgu preview mgu_lab --out out/preview.png

./out/mgu preview mgu_lab --gif out/preview.gif

./out/mgu.exe build; ./out/mgu.exe kit

./out/mgu.exe --auto --key "./id_rsa" car upload | check | install | status

./out/mgu.exe --auto --key "./id_rsa" download mgu_lab

./out/mgu.exe --auto --key "./id_rsa" download head-unit

./out/mgu.exe kit live_data_viewer; ./out/mgu.exe --auto --key "./id_rsa" car install


# apps

## live data viewer 

### driving / dynamics
- rpm, torque, boost, power guages
- exhaust valve controls
- coolant temp, oil temp, transmission temp
- fuel
- battery

- g force meter
- tire temp, speed, pressure, angle (steering), sway bar torque
- xdrive power dist
- brake pedal, accel pedal, kickdown, parking brake

### car status
- Engine oil temperature — vehicle bus
- Engine coolant / water temperature — vehicle bus
- Transmission oil temperature - ECU 0x18, UDS 22 DA12

- transfer case oil temp
- front diff oil temp
- rear diff oil temp
- IAT dme1
- IAT dme2

- LPFP pressure
- HPFP pressure
- Oil pressure
- transmission oil pressure
- misfires
- knocks
- timing correction

- outside temp
- charge cooler coolant
- cabin temp
