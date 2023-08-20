@echo on

chdir %~dp0
chdir ..
if not exist ".\dist" mkdir ".\dist"

:: Build executable.
:: Uncomment when it will be fixed.
:: bazel build --cxxopt=/MT -- //...

:: Build visulizer.
pyinstaller -F ".\scripts\visualizer.py"

call :build_dist_function "example", ""
call :build_dist_function "example_fr", "-fr"

del ".\dist\visualizer.exe"

EXIT /B %ERRORLEVEL%

:build_dist_function

set DATA_DIR=%~1
set SUFFIX=%~2

set "NAME=TimetablingSolver-windows%SUFFIX%"
set "TARGET_DIR=.\dist\%NAME%"

rmdir /s /q "%TARGET_DIR%"
del "%TARGET_DIR%.zip"
mkdir "%TARGET_DIR%"
mkdir "%TARGET_DIR%\bin"
mkdir "%TARGET_DIR%\data"
:: Copy script.
copy ".\scripts\run.bat" "%TARGET_DIR%\run.bat"
:: Copy data.
robocopy /s /e ".\data\%DATA_DIR%" "%TARGET_DIR%\data"
:: Build and copy executable.
copy ".\bazel-bin\timetablingsolver\main.exe" "%TARGET_DIR%\bin\TimetablingSolver.exe"
:: Copy visualizer.
copy ".\dist\visualizer.exe" "%TARGET_DIR%\bin\visualizer.exe"

chdir ".\dist"
zip -r "%NAME%.zip" "%NAME%"
chdir ..

EXIT /B 0
