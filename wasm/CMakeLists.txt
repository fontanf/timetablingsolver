add_executable(TimetablingSolver_wasm)
target_sources(TimetablingSolver_wasm PRIVATE
    src/timetablingsolver_wasm.cpp)
target_link_libraries(TimetablingSolver_wasm PRIVATE
    TimetablingSolver_timetabling)
target_link_options(TimetablingSolver_wasm PRIVATE
    -lembind
    # Load with 'await TimetablingSolver()', in the browser, a web worker or
    # Node.
    -sMODULARIZE=1
    -sEXPORT_NAME=TimetablingSolver
    -sENVIRONMENT=web,worker,node
    -sALLOW_MEMORY_GROWTH=1
    # The default stack (64 KB) isn't enough for HiGHS: it overflows on
    # instances of a few dozens of courses. The stack of a native program.
    -sSTACK_SIZE=8MB)
# embind requires C++17: only the bindings are compiled with it, the library
# stays C++14.
set_target_properties(TimetablingSolver_wasm PROPERTIES
    CXX_STANDARD 17
    OUTPUT_NAME "timetablingsolver"
    SUFFIX ".js")
