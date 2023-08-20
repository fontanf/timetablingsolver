#!/bin/bash

VERSION="0.2"
TARGET_DIR="./dist/TimetablingSolver-${VERSION}-linux"

set -x
cd "$(dirname "$0")"
cd ..
rm -r "${TARGET_DIR}"
mkdir "${TARGET_DIR}"
mkdir "${TARGET_DIR}/bin"
mkdir "${TARGET_DIR}/data"
mkdir "${TARGET_DIR}/log"
mkdir "${TARGET_DIR}/out"
# Copy script.
cp "./scripts/run.sh" "${TARGET_DIR}/run.sh"
# Copy data.
cp ./data/example/*.csv "${TARGET_DIR}/data/"
# Build and copy executable.
bazel build -- //...
cp "./bazel-bin/timetablingsolver/main" "${TARGET_DIR}/bin/TimetablingSolver"
chmod 755 "${TARGET_DIR}/bin/TimetablingSolver"
# Copy visualizer.
pyinstaller -F "./scripts/visualizer.py"
mv "./dist/visualizer" "${TARGET_DIR}/bin/visualizer"
