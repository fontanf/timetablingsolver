#include "timetablingsolver/instance_builder.hpp"
#include "timetablingsolver/optimize.hpp"

#include <gtest/gtest.h>
#include <boost/filesystem.hpp>

using namespace timetablingsolver;
namespace fs = boost::filesystem;

struct TestParams
{
    fs::path instance_path;
    fs::path certificate_path;
};

inline std::ostream& operator<<(std::ostream& os, const TestParams& test_params)
{
    os << test_params.instance_path;
    return os;
}

class OptimizeTest: public testing::TestWithParam<TestParams> { };

TEST_P(OptimizeTest, Algorithm)
{
    TestParams test_params = GetParam();
    InstanceBuilder instance_builder;
    instance_builder.read(test_params.instance_path.string());
    Instance instance = instance_builder.build();

    OptimizeParameters optimize_parameters;
    Output output = optimize(instance, optimize_parameters);

    Solution solution(instance, test_params.certificate_path.string());
    EXPECT_EQ(!(output.solution < solution), true);
    EXPECT_EQ(!(solution < output.solution), true);
}

INSTANTIATE_TEST_SUITE_P(
        Optimize,
        OptimizeTest,
        testing::ValuesIn(std::vector<TestParams>{
            {
                fs::path("data") / "tests" / "test_1.json",
                fs::path("data") / "tests" / "test_1_solution.json"
            }, {
                fs::path("data") / "tests" / "test_2.json",
                fs::path("data") / "tests" / "test_2_solution.json"
            }}));
