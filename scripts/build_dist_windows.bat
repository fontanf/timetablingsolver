if not exist ".\dist" mkdir ".\dist"

set VERSION="0.2"
set TARGET_DIR="./dist/TimetablingSolver-${VERSION}-windows"

chdir %~dp0
chdir ..

rmdir /s /q "%TARGET_DIR%"
mkdir "%TARGET_DIR%"
mkdir "%TARGET_DIR%\bin"
mkdir "%TARGET_DIR%\data"
mkdir "%TARGET_DIR%\log"
mkdir "%TARGET_DIR%\out"
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
