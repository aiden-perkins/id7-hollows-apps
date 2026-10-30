# random
- make upstream apps use old icons, dunno when it changed
- get new icons for my apps

# research items
I have some deep research items in ideas.md, i want you to take a look at the "" and do a deep research for it using reverse engineer anything. 

this is the data available to look through:
- the full mgu headunit storage is in out/downloads
- other data related items are in this project folder as well
- ista is fully installed with a full dataset for all coding options, so you can look through this
- esys is also installed with a bunch of data, also useful to look through this
- anything else you may find, try your best

the goal is to read what I wrote and make a markdown file outlining your findings, then after that create a lab app that specifically tests your findings, so it can be refined and polished later but debugged initially  

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

## other data to be found - testing
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
- check colors & check data

### driving
- maybe switch the guages to horizontal bars
- make the fuel  item better, 2 digits maybe
- make the battery thing look better

### temperatures
- charge-cooler coolant, per-bank exhaust/catalyst temperatures, and transfer-case/rear-differential

### engine health
- why is knock a decimal
- remove the "same counter period" text and whatever the 8/8 fresh is, what are these what do they mean?
- lots of empty space margins from the cylinder number values, fill it out a bit
