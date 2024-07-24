add_library(TimetablingSolver_timetabling)
target_sources(TimetablingSolver_timetabling PRIVATE
    instance.cpp
    instance_builder.cpp
    solution.cpp
    algorithm_formatter.cpp
    optimize.cpp
    milp.cpp)
target_include_directories(TimetablingSolver_timetabling PUBLIC
    ${PROJECT_SOURCE_DIR}/include)
target_include_directories(TimetablingSolver_timetabling PRIVATE
    ${PROJECT_SOURCE_DIR}/src)
target_link_libraries(TimetablingSolver_timetabling PUBLIC
    OptimizationTools::utils
    highs)
add_library(TimetablingSolver::timetabling ALIAS TimetablingSolver_timetabling)

add_executable(TimetablingSolver_main)
target_sources(TimetablingSolver_main PRIVATE
    main.cpp)
target_link_libraries(TimetablingSolver_main PUBLIC
    TimetablingSolver_timetabling
    Boost::program_options)
set_target_properties(TimetablingSolver_main PROPERTIES OUTPUT_NAME "timetablingsolver")
install(TARGETS TimetablingSolver_main)
