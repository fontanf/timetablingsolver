chdir %~dp0
chdir ..
:: Copy script.
copy ".\scripts\run.bat" ".\dist\windows\run.bat"
:: Copy data.
copy .\data\example\*.csv ".\dist\windows\data\"
:: Build and copy executable.
bazel build --cxxopt=/MT -- //...
copy ".\bazel-bin\timetablingsolver\main.exe" ".\dist\windows\bin\TimetablingSolver.exe"
:: Copy visualizer.
pyinstaller -F ".\scripts\visualizer.py"
move ".\dist\visualizer.exe" ".\dist\windows\bin\visualizer.exe"
