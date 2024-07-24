#include "timetablingsolver/optimize.hpp"

#include "timetablingsolver/algorithm_formatter.hpp"

#include "milp.hpp"

using namespace timetablingsolver;

Output timetablingsolver::optimize(
        const Instance& instance,
        const OptimizeParameters& parameters)
{
    Output output(instance);
    AlgorithmFormatter algorithm_formatter(instance, parameters, output);
    algorithm_formatter.start();
    algorithm_formatter.print_header();

    MilpParameters milp_parameters;
    //milp_parameters.mps_path = parameters.milp_mps_path;
    milp_parameters.maximum_number_of_nodes = 1024;
    milp_parameters.verbosity_level = 0;
    milp_parameters.timer = parameters.timer;
    MilpOutput milp_output = milp(instance, milp_parameters);

    algorithm_formatter.update_solution(milp_output.solution, "");

    algorithm_formatter.end();
    return output;
}
