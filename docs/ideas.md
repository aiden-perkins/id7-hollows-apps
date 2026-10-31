# random
- get new icons for my apps
- that dark red replaced with teal was the red warning light - swap teal and red

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

## widgets
- see how these are stored/engineered
- make my own to go with my apps
- add more?

## cluster customization + other
- can the cluster be edited? customized? what can be done
- my own custom pfp?
- change the notification style pop up?
- android auto on cluster?

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

## trip data
- history stas, top speed, top elevation, lowest elevation, best/worst mpg, min/max distance, etc




## live data viewer 

### driving
- rpm, torque, boost, power guages
- exhaust valve controls
- coolant temp, oil temp, transmission temp
