#pragma once

#include "timetablingsolver/solution.hpp"

namespace timetablingsolver
{

struct OptimizeOptionalParameters
{
    optimizationtools::Info info = optimizationtools::Info();
};

struct Output
{
    Output(
            const Instance& instance,
            optimizationtools::Info& info);

    void display(optimizationtools::Info& info);

    Output& algorithm_end(optimizationtools::Info& info);

    Solution solution;
};

Output optimize(
        const Instance& instance,
        OptimizeOptionalParameters parameters = {});

}

