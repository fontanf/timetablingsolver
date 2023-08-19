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

    /** Path to which to MPS files of the MILP solved will be written. */
    std::string mps_path;

    /** Maximum number of nodes for the MILP solver. */
    Counter maximum_number_of_nodes = -1;
};

MilpCbcOutput milp_cbc(
        const Instance& instance,
        MilpCbcOptionalParameters parameters = {});

}

#endif

