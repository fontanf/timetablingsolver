if not exist ".\dist" mkdir ".\dist"

set TARGET_DIR="./dist/TimetablingSolver-windows"

chdir %~dp0
chdir ..

rmdir /s /q "%TARGET_DIR%"
del "%TARGET_DIR%.zip"
mkdir "%TARGET_DIR%"
mkdir "%TARGET_DIR%\bin"
mkdir "%TARGET_DIR%\data"
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

tar.exe -a -cf "%TARGET_DIR%.zip" "%TARGET_DIR%"
