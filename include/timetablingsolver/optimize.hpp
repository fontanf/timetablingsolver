#pragma once

#include "timetablingsolver/solution.hpp"

#include "optimizationtools/utils/output.hpp"

namespace timetablingsolver
{

struct OptimizeParameters: optimizationtools::Parameters
{
};

struct Output: optimizationtools::Output
{
    Output(const Instance& instance):
        solution(instance) { }


    /** Solution pool. */
    Solution solution;

    /** Elapsed time. */
    double time = 0.0;


    virtual nlohmann::json to_json() const
    {
        return nlohmann::json {
            {"Solution", solution.to_json()},
            {"Time", time}
        };
    }

    virtual int format_width() const { return 11; }

    virtual void format(std::ostream& os) const
    {
        int width = format_width();
        os
            << std::setw(width) << std::left << "Time (s): " << time << std::endl
            ;
    }
};

Output optimize(
        const Instance& instance,
        const OptimizeParameters& parameters = {});

}
