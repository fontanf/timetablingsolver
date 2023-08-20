#!/bin/sh

mkdir -p "./dist"

TARGET_DIR="./dist/TimetablingSolver-darwin"

set -x
cd "$(dirname "$0")"
cd ..
rm -r "${TARGET_DIR}"
mkdir "${TARGET_DIR}"
mkdir "${TARGET_DIR}/bin"
mkdir "${TARGET_DIR}/data"
mkdir "${TARGET_DIR}/lib"
mkdir "${TARGET_DIR}/log"
mkdir "${TARGET_DIR}/out"
# Copy script.
cp "./scripts/run.mac.sh" "${TARGET_DIR}/run.sh"
# Copy data.
cp ./data/example/*.csv "${TARGET_DIR}/data/"
# Copy lib.
cp ./bazel-timetablingsolver/external/cbc_darwin/lib/*.dylib "${TARGET_DIR}/lib/"
cp ./bazel-timetablingsolver/external/clp_darwin/lib/*.dylib "${TARGET_DIR}/lib/"
cp ./bazel-timetablingsolver/external/coinutils_darwin/lib/*.dylib "${TARGET_DIR}/lib/"
cp ./bazel-timetablingsolver/external/osi_darwin/lib/*.dylib "${TARGET_DIR}/lib/"
# Build and copy executable.
bazel build -- //...
cp "./bazel-bin/timetablingsolver/main" "${TARGET_DIR}/bin/TimetablingSolver"
chmod 755 "${TARGET_DIR}/bin/TimetablingSolver"
# Copy visualizer.
pyinstaller -F "./scripts/visualizer.py"
mv "./dist/visualizer" "${TARGET_DIR}/bin/visualizer"

zip -R "${TARGET_DIR}.zip" "${TARGET_DIR}"
