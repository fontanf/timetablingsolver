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

TEST(OptimizeTest, DefaultScore)
{
    // Resource 1 is only available at time 1, with a score of 1. Without a
    // default score, scheduling the event at time 0 costs 0; with a default
    // score of 10, it costs 10, so the event is scheduled at time 1.
    InstanceBuilder instance_builder;
    instance_builder.set_horizon(2);
    instance_builder.set_default_score(10);
    ResourceId resource_id_0 = instance_builder.add_resource();
    ResourceId resource_id_1 = instance_builder.add_resource();
    EventId event_id = instance_builder.add_event(1);
    instance_builder.add_resource(event_id, resource_id_0);
    instance_builder.add_resource(event_id, resource_id_1);
    instance_builder.set_score(resource_id_0, 0, 1);
    instance_builder.set_score(resource_id_0, 1, 1);
    instance_builder.set_score(resource_id_1, 1, 1);
    Instance instance = instance_builder.build();

    Output output = optimize(instance);
    EXPECT_EQ(output.solution.event(event_id).start, 1);
    EXPECT_EQ(output.solution.score(), 2);
}
