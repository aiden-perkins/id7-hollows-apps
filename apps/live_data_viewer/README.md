# live data viewer

## current problems/things to change

*   RAM channels don't work in bm3 tab

## tabs

### driving / dynamics

#### data

| Data                                 | units                     | min | max             | graphic                           | notes                                          |
| ------------------------------------ | ------------------------- | --- | --------------- | --------------------------------- | ---------------------------------------------- |
| RPM                                  | #                         | 0   | 7000            | bar graph                         | done                                           |
| Torque                               | lb/ft                     | 0   | 1000            | bar graph                         | done                                           |
| Boost                                | psi                       | 0   | 32              | bar graph                         | done                                           |
| Power                                | hp                        | 0   | 1000            | bar graph                         | done                                           |
| Exhaust Valve Controller             | open/closed               | N/A | N/A             | graphic/buttons                   | done                                           |
| Coolant Temperature                  | F                         | N/A | N/A             | # + units (#u)                    | changes color based on readiness               |
| Oil Temperature                      | F                         | N/A | N/A             | #u                                | changes color based on readiness               |
| Transmission Temperature             | F                         | N/A | N/A             | #u                                | changes color based on readiness               |
| Fuel Tank                            | Gal/%                     | N/A | N/A             | #u                                | done                                           |
| Battery                              | V                         | N/A | N/A             | #u                                | done                                           |
| G-Force Meter                        | G                         | 0   | 1.5             | circular with dot                 | done                                           |
| Tire Temperature                     | F                         | N/A | N/A             | next to each wheel #u             | changes color based on readiness               |
| Tire Speed                           | raw / mph                 | N/A | N/A             | next to each wheel #u             | needs to be confirmed                          |
| Tire Pressure                        | psi                       | N/A | N/A             | next to each wheel #u             | done                                           |
| Front Wheel Steering Angle           | degrees                   | N/A | N/A             | wheel moves #u                    | done                                           |
| Rear Wheel Steering Angle            | degrees                   | N/A | N/A             | wheel moves #u                    | too slow                                       |
| Front Sway Bar Torque                | nm                        | -?  | ?               | bar on front axle #u              | need to check                                  |
| Rear Sway Bar Torque                 | nm                        | -?  | ?               | bar on rear axle #u               | need to check                                  |
| Transfer Case Power Distribution     | % / estimated hp          | 0%  | 100%            | vertical bar and axle HP readouts | need to check                                  |
| Rear Differential Power Distribution | hp/lb-ft/%                | ?   | ?               | bar on rear axle #u               | need to check                                  |
| Front Automatic Differential Brake   | ?                         | ?   | ?               | bar on front axle #u              | needs datasource                               |
| Accelerator Pedal                    | %                         | 0   | 100             | bar graph                         | jumps around all over the place - not accurate |
| Brake Pedal                          | raw / bar                 | 0   | 62 raw / 84 bar | bar graph                         | testing new data source                        |
| Kickdown                             | on/off                    | N/A | N/A             | unsure                            | too slow                                       |
| Parking Brake                        | on/releasing/engaging/off | N/A | N/A             | unsure                            | done                                           |

#### temperature readiness

| Driving readout  | Display key   | Ready from (°F) | Red from (°F) |
| ---------------- | ------------- | --------------- | ------------- |
| Engine oil       | oilCds        | 180             | 250           |
| Coolant          | coolantCds    | 175             | 230           |
| Transmission     | transmission2 | 130             | 220           |
| All four tires   | tyreTemp      | 80              | 140           |

Readings are blue below Ready, match the theme's main gauges from Ready up to the red cutoff, and turn red at the cutoff. The thresholds apply to the displayed whole-degree temperature. Held or unavailable readings are gray.

To change these display defaults, edit the two temperature columns and rebuild Live Data Viewer. Use whole degrees Fahrenheit in ascending order for each reading.

#### ideas

*   maybe a way to record the current drive to a file, so the ui can be remade later and added to a video
*   parking brake engage from touchscreen
*   change traction from touch screen
*   look into adaptive dampers data
*   possible to write to the dynamics? sway bars, rear steering, and dampers

### car status

#### data

| Data                          | Units   | Source     | notes                                                                                                 | upstream? |
| ----------------------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------- | --------- |
| Oil Temperature               | °F      |            | done                                                                                                  | yes       |
| Coolant Temperature           | °F      |            | done                                                                                                  | yes       |
| Transmission Temperature      | °F      |            | done                                                                                                  | yes       |
| Rear Differential Temperature | °F      |            | confirm it is correct/doesn't disconnect                                                              | no        |
| Charge Air Temperature        | °F      |            | done                                                                                                  | yes       |
| Internal Air Temperature      | °F      |            | confirm it is correct/doesn't disconnect                                                              | not both  |
| HPFP Target Pressure          | PSI     |            | confirm it is correct/doesn't disconnect                                                              | yes       |
| HPFP Actual Pressure          | PSI     |            | confirm it is correct/doesn't disconnect                                                              | yes       |
| Boost Target Pressure         | PSI     |            | confirm it is correct/fast                                                                            | yes       |
| Boost Actual Pressure         | PSI     |            | confirm it is correct/fast                                                                            | yes       |
| Oil Pressure                  | PSI     |            | done                                                                                                  | yes       |
| Misfires                      | #       |            | done                                                                                                  | yes       |
| Knocks Detected               | #       |            | done                                                                                                  | yes       |
| Max Timing Correction         | Degrees |            | bm3 RAM channels currently broken                                                                     | no        |
| Outside Temperature           | °F      |            | confirm it is correct/doesn't disconnect                                                              | yes       |

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
