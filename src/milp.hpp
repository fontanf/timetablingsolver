#pragma once

#include "timetablingsolver/solution.hpp"

#include "optimizationtools/utils/parameters.hpp"

namespace timetablingsolver
{

struct MilpOutput
{
    /** Constructor. */
    MilpOutput(const Instance& instance): solution(instance) { }

    /** Solution. */
    Solution solution;
};

struct MilpParameters: optimizationtools::Parameters
{
    /** Path to which to MPS files of the MILP solved will be written. */
    std::string mps_path;

    /** Maximum number of nodes for the MILP solver. */
    Counter maximum_number_of_nodes = -1;
};

MilpOutput milp(
        const Instance& instance,
        const MilpParameters& parameters = {});

}
