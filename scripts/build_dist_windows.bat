chdir %~dp0
chdir ..
if not exist ".\dist" mkdir ".\dist"

:: Build executable.
bazel build --cxxopt=/MT -- //...
:: Build visulizer.
pyinstaller -F ".\scripts\visualizer.py"

call :build_dist_function "example", ""
call :build_dist_function "example_fr", "-fr"

del ".\dist\visualizer.exe"

EXIT /B %ERRORLEVEL%
:build_dist_function

set DATA_DIR=%~1
set SUFFIX=%~2

set NAME="TimetablingSolver-windows%SUFFIX%"
set TARGET_DIR=".\dist\%NAME%"

rmdir /s /q "%TARGET_DIR%"
del "%TARGET_DIR%.zip"
mkdir "%TARGET_DIR%"
mkdir "%TARGET_DIR%\bin"
:: Copy script.
copy ".\scripts\run.bat" ".\dist\windows\run.bat"
:: Copy data.
copy ".\data\%DATA_DIR%" ".\dist\windows\data"
:: Build and copy executable.
copy ".\bazel-bin\timetablingsolver\main.exe" ".\dist\windows\bin\TimetablingSolver.exe"
:: Copy visualizer.
copy ".\dist\visualizer.exe" ".\dist\windows\bin\visualizer.exe"

chdir ".\dist"
zip -r "%TARGET_DIR%.zip" "%TARGET_DIR%"
chdir ..

EXIT /B 0
