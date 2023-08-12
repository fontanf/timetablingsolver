#pragma once

#if CBC_FOUND

#include "timetablingsolver/solution.hpp"

namespace timetablingsolver
{

struct MilpCbcOutput
{
    /** Constructor. */
    MilpCbcOutput(const Instance& instance): solution(instance) { }

    /** Solution. */
    Solution solution;
};

struct MilpCbcOptionalParameters
{
    /** Info structure. */
    optimizationtools::Info info = optimizationtools::Info();
};

MilpCbcOutput milp_cbc(
        const Instance& instance,
        MilpCbcOptionalParameters parameters = {});

}

#endif

