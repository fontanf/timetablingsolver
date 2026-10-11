cmake_minimum_required(VERSION 3.15.0)

project(TimetablingSolver LANGUAGES CXX)

# Build options.
option(TIMETABLINGSOLVER_BUILD_MAIN "Build main" ON)
option(TIMETABLINGSOLVER_BUILD_TEST "Build unit tests" ON)
option(TIMETABLINGSOLVER_BUILD_WASM "Build the WebAssembly module (with Emscripten)" OFF)

# Avoid FetchContent warning.
cmake_policy(SET CMP0135 NEW)

# Require C++14.
set(CMAKE_CXX_STANDARD 14)

# The WebAssembly module is built with Emscripten, without thread support: the
# page runs it in a Web Worker. C++ exceptions are enabled (they are disabled
# by default with Emscripten), since the library reports invalid inputs with
# exceptions.
if(TIMETABLINGSOLVER_BUILD_WASM)
    if(NOT EMSCRIPTEN)
        message(FATAL_ERROR "TIMETABLINGSOLVER_BUILD_WASM requires the Emscripten toolchain (use emcmake)")
    endif()
    set(TIMETABLINGSOLVER_BUILD_MAIN OFF)
    set(TIMETABLINGSOLVER_BUILD_TEST OFF)
    add_compile_options(-fwasm-exceptions)
    add_link_options(-fwasm-exceptions)
endif()

# Enable output of compile commands during generation.
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Add sub-directories.
add_subdirectory(extern)
add_subdirectory(src)
if(TIMETABLINGSOLVER_BUILD_TEST)
    add_subdirectory(test)
endif()
if(TIMETABLINGSOLVER_BUILD_WASM)
    add_subdirectory(wasm)
endif()
