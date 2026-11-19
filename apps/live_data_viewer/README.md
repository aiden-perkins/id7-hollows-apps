# live data viewer

## current problems/things to change

*   RAM channels don't work in bm3 tab
*   fix the data channels with these 2 new tables
*   test to see if all of the data that needs to be fast, is fast

## tabs

### driving / dynamics

#### data

| Data | units | min | max | upstream confirmed fast? | upstream? | implemented? | graphic | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RPM | # | 0 | 7000 | yes | yes | yes | bar graph | 6k-6.3k yellow, 6.3k-6.5k orange, 6.5k-7k red | add 2 more lines to show where rpm would be on a downshift and upshift |
| Torque | lb/ft | 0 | 1000 | yes | yes | yes | bar graph |   |
| Boost | psi | 0 | 32 | yes | yes | yes | bar graph |   |
| Power | hp | 0 | 1000 | yes | yes | yes | bar graph | calculated from torque & rpm |
| Exhaust Valve Controller | open/closed | N/A | N/A | not needed | yes | yes | graphic/buttons | make sure it uses the same as upstream |
| Coolant Temperature | F | N/A | N/A | not needed | yes | yes | \# + units (#u) | changes color based on readiness |
| Oil Temperature | F | N/A | N/A | not needed | yes | yes | #u | changes color based on readiness |
| Transmission Temperature | F | N/A | N/A | not needed | yes - EGS`0x18`, UDS `22 6000` | try up | #u | changes color based on readiness |
| Fuel Tank | Gal/% | N/A | N/A | not needed | yes | yes | #u | show both gallons & percentage of 18 gal |
| Battery | V | N/A | N/A | not needed | yes | yes | #u |   |
| G-Force Meter | G | 0 | 2 | yes | yes | yes | circular with dot | show a little trail with min + max |
| Tire Temperature | F | N/A | N/A | not needed | yes | yes | next to each wheel #u | changes color based on readiness |
| Tire Speed | mph | N/A | N/A | Powertrain.ActualValueRPMWheel | yes | slow - try up | next to each wheel #u |   |
| Tire Pressure | psi | N/A | N/A | not needed | yes | yes | next to each wheel #u |   |
| Front Wheel Steering Angle | degrees | N/A | N/A | SteeringAngle.ActualSteeringAngleDriver/actualSteeringAngleDriverNoCRC | yes | slow - try up | wheel moves #u |   |
| Rear Wheel Steering Angle | degrees | N/A | N/A | no | no | slow | wheel moves #u | wheels should move 10x scale to actual |
| Front Sway Bar Torque | nm | \-? | ? | no | no | slow | bar on front axle #u | negative/positive equates to left/right |
| Rear Sway Bar Torque | nm | \-? | ? | no | no | slow | bar on rear axle #u | negative/positive equates to left/righ |
| Transfer Case Power Distribution | hp/lb-ft/% | ? | ? | BasicDataSet.valueDistributionLongitudinalTorqueRearAxisFrontAxis | kinda | no | vertical bar on car #u | disengaged = 100% to the rear, 50/50 for engaged |
| Rear Differential Power Distribution | hp/lb-ft/% | ? | ? | no | no | no | bar on rear axle #u | disengaged = 50/50, engaged = 100% to a side |
| Front Automatic Differential Brake | ? | ? | ? | no | no | no | bar on front axle #u | unsure what units |
| Accelerator Pedal | % | 0 | 100 | AcceleratorPedal.AngleAcceleratorPedal.actualValueAngleAcceleratorPedal & other DME | yes | slow - try up | bar graph |   |
| Brake Pedal | bar/% | 0 | 84 | VehicleStabilizationManagement.StabilizationManagement.statusBrakingDriver | kinda | slow - try up | bar graph |   |
| Kickdown | on/off | N/A | N/A | no | no | needs confirming | unsure | either a button/card or something with the accel |
| Parking Brake | on/releasing/engaging/off | N/A | N/A | not needed | mine is better | yes | unsure | probably a button/card - check if mine is better |

#### ideas

*   maybe a way to record the current drive to a file, so the ui can be remade later and added to a video
*   color scheme needs to improve and match the mode - but also temp stuff should be dynamic
*   parking brake engage from touchscreen
*   change traction from touch screen
*   look into adaptive dampers data
*   possible to write to the dynamics? sway bars, rear steering, and dampers

### car status

#### data

| Data | Units | Source | notes | upstream? |
| --- | --- | --- | --- | --- |
| Oil Temperature | °F | driving |   | yes |
| Coolant Temperature | °F | driving |   | yes |
| Transmission Temperature | °F | driving |   | yes |
| Rear Differential Temperature | °F | check ista | has a temp sensor | no |
| Charge Air Temperature | °F |   | both dmes - after intercoolers | yes |
| Internal Air Temperature | °F | bm3 | both dmes - before intercoolers | not both |
| LPFP Target Pressure | PSI | bm3 |   | no |
| LPFP Actual Pressure | PSI |   |   | yes |
| HPFP Target Pressure | PSI |   |   | yes |
| HPFP Actual Pressure | PSI |   |   | yes |
| Boost Target Pressure | PSI |   |   | yes |
| Boost Actual Pressure | PSI |   |   | yes |
| Oil Pressure | PSI |   |   | yes |
| Misfires | # |   | all 8 cylinders | yes |
| Knocks Detected | # |   | both DMEs | yes |
| Max Timing Correction | Degrees | bm3 | all 8 cylinders | no |
| Outside Temperature | °F |   |   | yes |

#### ideas

*   things wanted but probably don't exist
    *   transmission oil pressure
    *   front diff oil temp
    *   transfer case oil temp
    *   charger cooler coolant temp

### settings

#### changes

*   remove the engine family setting - just get this from the car?
*   getter refresh should always be 100ms, no need for this setting
*   boost source shouldnt be selectable - keep it the same as it is
*   add 5 minutes to graph window
*   what is category order, remove this, not sure why its here