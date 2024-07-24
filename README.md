# TimetablingSolver

A solver for timetabling problems.

## Usage

Compile:
```shell
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release --parallel
cmake --install build --config Release --prefix install
```

Execute:
```shell
./install/bin/timetablingsolver  --verbosity-level 4  --input data/tests/test_1.json  --certificate solution.csv
```
