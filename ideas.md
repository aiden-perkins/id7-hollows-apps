# random
- make upstream apps use old icons, dunno when it changed
- get new icons for my apps
- disassemble mgu lab - no longer needed
- ask it to probe the head unit files, see if it can find anything interesting to work on project wise

# research items

## 2wd/4wd mxdrive converting - testing
- be able to convert through an app
- is this just fully releasing the tc clutch?

## full exterior light control - testing
- turn on high beams, DRLs, parking light, rear tail lights, license plate like, etc from app
- see if this can work > 15 mph
- rename ambient lighting profiles + fully be able to change the lighting colors through an app - dont have to code ncds

## recieve touch screen events - testing
- be able to see touch screen events and make uis so much better
- swiping and clicking

## other data to be found
- exhaust valve position
- transfer case clutch power/percent/engaged amount? whats sent to the front wheels
- individual wheel speed and direction
- rear wheel steering degrees
- dynamic sway bar actuator pressure/voltage/engagement?

## phone connection
- can I access phone connection? bluetooth?
- can the car get wifi?
- can it connect to my uniden r8?

## how complex can I add games?
- games like pacman, super mario, etc should be easy...
- what about apks? clash of clans, fallout shelter, factorio?

## widgets
- see how these are stored/engineered
- make my own to go with my apps
- add more?

## cluster customization + other
- can the cluster be edited? customized? what can be done
- my own custom pfp?
- change the notification style pop up?

## map switching
- determine how bm3 handles map switching for other cars, see if I can reproduce on my dme
- make app to switch between maps


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

## ambient lighting controls
- be able to map all of the driving modes to a item in the ambient lighting menu
- be able to edit any of the ambient lighting items with the idrive controller
- fully replace all settings in the idrive ambient lighting menu


## trip data
- history stas, top speed, top elevation, lowest elevation, best/worst mpg, min/max distance, etc


## live data viewer 
- update way faster than it currently is

### driving
- if the parking break is applied or not
- if the kickdown is engaged accel pedal
- make the brake lights on the mini car match the brake pedal
- fuel cannister for gas numbers
- remove trans pressure - moved to temps
- more decimals for fuel

### temperatures
- remove the titles to each graph, they are already shown in the cards themselves
- what is OBS? 
- what are these horrible looking colors? please make all colors uniform accross the app
- theres a lot of room between the temp title and the graph, make the graphs slightly wider?
- isnt there per bank IAT?
- remove tire pressure graph and replace with oil/trans pressure + others

### engine health
- whats with the text on the bottom of the timing/misfire/knock? remove it
- remove the actual & target stuff from the graphs, they should take up the whole area with the titles
- somewhere put a small key with the colors for actual/target
- i know misfires are per cylinder and so is timing correct, is knocks? i thought there was just a knock counter per bank
- change the layout to make mini v8 with the clyinders, just barely though, i dont want a full blown v8 image, just use it for inspiration so I can tell

