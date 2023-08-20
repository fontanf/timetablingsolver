#!/bin/sh

set -x
cd "$(dirname "$0")"
cd ..
mkdir -p "./dist"

# Build executable.
bazel build --linkopt="-L/usr/local/lib" -- //...
# Build visulizer.
pyinstaller -F "./scripts/visualizer.py"

build_dist_function()
{
    DATA_DIR=$1
    SUFFIX=$2

    NAME="TimetablingSolver-macos${SUFFIX}"
    TARGET_DIR="./dist/${NAME}"

    rm -rf "${TARGET_DIR}"
    rm -rf "${TARGET_DIR}.zip"
    mkdir "${TARGET_DIR}"
    mkdir "${TARGET_DIR}/bin"
    mkdir "${TARGET_DIR}/data"
    mkdir "${TARGET_DIR}/lib"
    # Copy script.
    cp "./scripts/run.mac.sh" "${TARGET_DIR}/run.sh"
    # Copy data.
    cp -r "./data/${DATA_DIR}" "${TARGET_DIR}/data"
    # Copy executable.
    cp "./bazel-bin/timetablingsolver/main" "${TARGET_DIR}/bin/TimetablingSolver"
    chmod 755 "${TARGET_DIR}/bin/TimetablingSolver"
    # Copy lib.
    cp ./bazel-timetablingsolver/external/cbc_darwin/lib/*.dylib "${TARGET_DIR}/lib/"
    cp ./bazel-timetablingsolver/external/clp_darwin/lib/*.dylib "${TARGET_DIR}/lib/"
    cp ./bazel-timetablingsolver/external/coinutils_darwin/lib/*.dylib "${TARGET_DIR}/lib/"
    cp ./bazel-timetablingsolver/external/osi_darwin/lib/*.dylib "${TARGET_DIR}/lib/"
    # Copy visualizer.
    cp "./dist/visualizer" "${TARGET_DIR}/bin/visualizer"

    cd "./dist"
    zip -r "${NAME}" "${NAME}"
    cd -
}

build_dist_function "example" ""
build_dist_function "example_fr" "-fr"
rm "./dist/visualizer"
