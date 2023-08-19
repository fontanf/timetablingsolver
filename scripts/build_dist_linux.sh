#!/bin/bash

set -x
cd "$(dirname "$0")"
cd ..
# Copy script.
cp "./scripts/run.sh" "./dist/linux/run.sh"
# Copy data.
cp ./data/example/*.csv "./dist/linux/data/"
# Build and copy executable.
bazel build -- //...
cp "./bazel-bin/timetablingsolver/main" "./dist/linux/bin/TimetablingSolver"
chmod 755 "./dist/linux/bin/TimetablingSolver"
# Copy visualizer.
pyinstaller -F "./scripts/visualizer.py"
mv "./dist/visualizer" "./dist/linux/bin/visualizer"
