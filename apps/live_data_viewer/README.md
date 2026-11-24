# live data viewer

## current problems/things to change

*   RAM channels don't work in bm3 tab
*   fix the data channels with these 2 new tables
*   test to see if all of the data that needs to be fast, is fast

## tabs

### driving / dynamics

#### data

| Data                                 | units                     | min | max             | graphic                           | notes                                          |
| ------------------------------------ | ------------------------- | --- | --------------- | --------------------------------- | ---------------------------------------------- |
| RPM                                  | #                         | 0   | 7000            | bar graph                         | done                                           |
| Torque                               | lb/ft                     | 0   | 1000            | bar graph                         | done                                           |
| Boost                                | psi                       | 0   | 32              | bar graph                         | done                                           |
| Power                                | hp                        | 0   | 1000            | bar graph                         | done                                           |
| Exhaust Valve Controller             | open/closed               | N/A | N/A             | graphic/buttons                   | make sure it uses the same as upstream         |
| Coolant Temperature                  | F                         | N/A | N/A             | # + units (#u)                    | changes color based on readiness               |
| Oil Temperature                      | F                         | N/A | N/A             | #u                                | changes color based on readiness               |
| Transmission Temperature             | F                         | N/A | N/A             | #u                                | changes color based on readiness               |
| Fuel Tank                            | Gal/%                     | N/A | N/A             | #u                                | done                                           |
| Battery                              | V                         | N/A | N/A             | #u                                | done                                           |
| G-Force Meter                        | G                         | 0   | 1.5             | circular with dot                 | done                                           |
| Tire Temperature                     | F                         | N/A | N/A             | next to each wheel #u             | changes color based on readiness               |
| Tire Speed                           | raw / mph                 | N/A | N/A             | next to each wheel #u             | number is wildly off                           |
| Tire Pressure                        | psi                       | N/A | N/A             | next to each wheel #u             | done                                           |
| Front Wheel Steering Angle           | degrees                   | N/A | N/A             | wheel moves #u                    | done                                           |
| Rear Wheel Steering Angle            | degrees                   | N/A | N/A             | wheel moves #u                    | too slow                                       |
| Front Sway Bar Torque                | nm                        | -?  | ?               | bar on front axle #u              | need to check                                  |
| Rear Sway Bar Torque                 | nm                        | -?  | ?               | bar on rear axle #u               | need to check                                  |
| Transfer Case Power Distribution     | % / estimated hp          | 0%  | 100%            | vertical bar and axle HP readouts | need to check                                  |
| Rear Differential Power Distribution | hp/lb-ft/%                | ?   | ?               | bar on rear axle #u               | need to check                                  |
| Front Automatic Differential Brake   | ?                         | ?   | ?               | bar on front axle #u              | need to check                                  |
| Accelerator Pedal                    | %                         | 0   | 100             | bar graph                         | jumps around all over the place - not accurate |
| Brake Pedal                          | raw / bar                 | 0   | 62 raw / 84 bar | bar graph                         | only showing 2 values                          |
| Kickdown                             | on/off                    | N/A | N/A             | unsure                            | too slow                                       |
| Parking Brake                        | on/releasing/engaging/off | N/A | N/A             | unsure                            | done                                           |

#### ideas

*   maybe a way to record the current drive to a file, so the ui can be remade later and added to a video
*   color scheme needs to improve and match the mode - but also temp stuff should be dynamic
*   parking brake engage from touchscreen
*   change traction from touch screen
*   look into adaptive dampers data
*   possible to write to the dynamics? sway bars, rear steering, and dampers

### car status

#### data

| Data                          | Units   | Source     | notes                                                                                                 | upstream? |
| ----------------------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------- | --------- |
| Oil Temperature               | °F      | driving    | done                                                                                                  | yes       |
| Coolant Temperature           | °F      | driving    | done                                                                                                  | yes       |
| Transmission Temperature      | °F      | driving    | done                                                                                                  | yes       |
| Rear Differential Temperature | °F      | check ista | has a temp sensor - find it and add it                                                                | no        |
| Charge Air Temperature        | °F      |            | done?                                                                                                 | yes       |
| Internal Air Temperature      | °F      | bm3        | fix bank 1 not being there - change name to IAT - confirm it changes and is correct - maybe match bm3 | not both  |
| LPFP Target Pressure          | PSI     | bm3        |                                                                                                       | no        |
| LPFP Actual Pressure          | PSI     |            |                                                                                                       | yes       |
| HPFP Target Pressure          | PSI     |            | change it to non abs                                                                                  | yes       |
| HPFP Actual Pressure          | PSI     |            | change it to non abs                                                                                  | yes       |
| Boost Target Pressure         | PSI     |            | confirm it is correct/fast                                                                            | yes       |
| Boost Actual Pressure         | PSI     |            | confirm it is correct/fast                                                                            | yes       |
| Oil Pressure                  | PSI     |            | done                                                                                                  | yes       |
| Misfires                      | #       |            | done                                                                                                  | yes       |
| Knocks Detected               | #       |            | done                                                                                                  | yes       |
| Max Timing Correction         | Degrees | bm3        | all 8 cylinders                                                                                       | no        |
| Outside Temperature           | °F      |            |                                                                                                       | yes       |

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