enable_testing()

include(GoogleTest)

add_executable(TimetablingSolver_timetabling_test)
target_sources(TimetablingSolver_timetabling_test PRIVATE
    optimize_test.cpp)
target_include_directories(TimetablingSolver_timetabling_test PRIVATE
    ${PROJECT_SOURCE_DIR}/src)
target_link_libraries(TimetablingSolver_timetabling_test
    TimetablingSolver_timetabling
    Boost::filesystem
    GTest::gtest_main)
gtest_discover_tests(TimetablingSolver_timetabling_test
    WORKING_DIRECTORY ${PROJECT_SOURCE_DIR})
