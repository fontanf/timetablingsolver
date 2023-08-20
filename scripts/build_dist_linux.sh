#!/bin/bash

set -x
cd "$(dirname "$0")"
cd ..
mkdir -p "./dist"

# Build executable.
bazel build -- //...
# Build visualizer.
pyinstaller -F "./scripts/visualizer.py"

build_dist_function()
{
    DATA_DIR=$1
    SUFFIX=$2

    NAME="TimetablingSolver-linux${SUFFIX}"
    TARGET_DIR="./dist/${NAME}"

    rm -rf "${TARGET_DIR}"
    rm -rf "${TARGET_DIR}.zip"
    mkdir "${TARGET_DIR}"
    mkdir "${TARGET_DIR}/bin"
    mkdir "${TARGET_DIR}/data"
    # Copy script.
    cp "./scripts/run.sh" "${TARGET_DIR}/run.sh"
    # Copy data.
    cp -r "./data/${DATA_DIR}" "${TARGET_DIR}/data"
    # Copy executable.
    cp "./bazel-bin/timetablingsolver/main" "${TARGET_DIR}/bin/TimetablingSolver"
    chmod 755 "${TARGET_DIR}/bin/TimetablingSolver"
    # Copy visualizer.
    cp "./dist/visualizer" "${TARGET_DIR}/bin/visualizer"

    cd "./dist"
    zip -r "${NAME}" "${NAME}"
    cd -
}

build_dist_function "example" ""
build_dist_function "example_fr" "-fr"
rm "./dist/visualizer"
