# go run ./cmd/mgu preview live_data_viewer --build --section driving --set demo=on --set "demoDriveMode=SPORT EXPERT" --gif out/driving-sport.gif
# go run ./cmd/mgu preview live_data_viewer --build --section driving --set demo=on --set demoDriveMode=COMFORT --gif out/driving-comfort.gif
# go run ./cmd/mgu preview live_data_viewer --build --section driving --set demo=on --set "demoDriveMode=ECO PRO EFFICIENT" --gif out/driving-eco-pro.gif

go run ./cmd/mgu preview live_data_viewer --build --section dynamics --warmup 0 --seconds 6 --set demo=on --set "demoDriveMode=SPORT EXPERT" --gif out/dynamics-sport.gif
# go run ./cmd/mgu preview live_data_viewer --build --section dynamics --warmup 0 --seconds 12 --set demo=on --set demoDriveMode=COMFORT --gif out/dynamics-comfort.gif
# go run ./cmd/mgu preview live_data_viewer --build --section dynamics --warmup 0 --seconds 12 --set demo=on --set "demoDriveMode=ECO PRO EFFICIENT" --gif out/dynamics-eco-pro.gif

# go run ./cmd/mgu preview live_data_viewer --build --section temperatures --set demo=on --set "demoDriveMode=SPORT EXPERT" --gif out/temperatures-sport.gif
# go run ./cmd/mgu preview live_data_viewer --build --section temperatures --set demo=on --set demoDriveMode=COMFORT --gif out/temperatures-comfort.gif
# go run ./cmd/mgu preview live_data_viewer --build --section temperatures --set demo=on --set "demoDriveMode=ECO PRO EFFICIENT" --gif out/temperatures-eco-pro.gif

./out/mgu.exe preview live_data_viewer --build --section driving --set demo=on --out out/live-data-driving.png
./out/mgu.exe preview live_data_viewer --build --section dynamics --set demo=on --out out/live-data-dynamics.png
./out/mgu.exe preview live_data_viewer --build --section temperatures --set demo=on --out out/live-data-temperatures.png
./out/mgu.exe preview live_data_viewer --build --section health --set demo=on --out out/live-data-health.png

