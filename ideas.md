# thoughts
- allow swiping and clicking? is this even possible?
- see if touch events can be recieved
- learn how the head unit os/ui works
- custom pfp photo
- notification style change up - new theme?
- uniden r8 connect and see alerts and stuff


# other
- make sure new apps match my m850i
- change the date format for new apps
- revert to the old icons - or ask how to do this
- add more games like pacman, super Mario, etc


# commands
go build -buildvcs=false -o out/mgu.exe ./cmd/mgu

./out/mgu preview mgu_lab --out out/preview.png

./out/mgu preview mgu_lab --gif out/preview.gif

./out/mgu.exe build; ./out/mgu.exe kit

./out/mgu.exe --auto --key "..\idrive7-8-ssh-root\data\enrollments\WBABC4C58KBU96457\id_rsa" car upload | check | install | status

./out/mgu.exe --auto --key "..\idrive7-8-ssh-root\data\enrollments\WBABC4C58KBU96457\id_rsa" download mgu_lab

./out/mgu.exe --auto --key "..\idrive7-8-ssh-root\data\enrollments\WBABC4C58KBU96457\id_rsa" download head-unit


# new apps


## ambient lighting controls
- be able to map all of the driving modes to a item in the ambient lighting menu
- be able to edit any of the ambient lighting items with the idrive controller
- fully replace all settings in the idrive ambient lighting menu


## trip data
- show elelvation graph
- show speed graph
- show mpg graph
- average speed
- average moving speed
- duration, moving duration
- distance
- top speed
- net altitude, total ascent/descent, max/min altitude, min/max altitude, altitude speed
- mpg+ from stuff above
- gallons of fuel
- gear data, how long in each gear, mpg at each gear, how many gear shifts, total rpms?
- mpg based on gear, based on speed, 


## live data viewer
- show all possible data
- show time engine has been running
- rear wheel steering angle?
- dynamic sway bar pressure?
- individual wheel speed, direction

### temps
- both trans temps, oil, water/coolant, iat, anything else relevant
- add min/max to some things

### driving related
- brake pedal, steering wheel, accel pedal, tpms data (serial number/uuid), current gear, speed, rpm, boost, hp, torque, gforces, battery voltage
- add S/D mode indicator to gear number

### engine health
- fuel pumps hp/lp, timing, knocks, misfires, etc
