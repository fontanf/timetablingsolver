#include "timetablingsolver/optimize.hpp"

#include "timetablingsolver/milp.hpp"

using namespace timetablingsolver;

Output::Output(
        const Instance& instance,
        optimizationtools::Info& info):
    solution(instance)
{
    // Standard output.
    info.os()
        << "===================================" << std::endl
        << "         TimetablingSolver         " << std::endl
        << "===================================" << std::endl
        << std::endl
        << "Instance" << std::endl
        << "--------" << std::endl;
    instance.print(info.os(), info.verbosity_level());
    info.os() << std::endl;
    info.os()
        << std::setw(12) << "T (s)"
        << std::setw(12) << "# events"
        << std::setw(12) << "Score"
        << std::setw(24) << "Comment"
        << std::endl
        << std::setw(12) << "-----"
        << std::setw(12) << "--------"
        << std::setw(12) << "-----"
        << std::setw(24) << "-------"
        << std::endl;
}

void Output::display(optimizationtools::Info& info)
{
    double t = info.elapsed_time();
    std::streamsize precision = std::cout.precision();
    std::stringstream s;
    info.os()
        << std::setw(12) << std::fixed << std::setprecision(3) << t << std::defaultfloat << std::setprecision(precision)
        << std::setw(12) << solution.number_of_events()
        << std::setw(12) << solution.score()
        << std::setw(24) << s.str()
        << std::endl;

    if (!info.output->only_write_at_the_end)
        info.write_json_output();
}

Output& Output::algorithm_end(optimizationtools::Info& info)
{
    double time = info.elapsed_time();

    info.add_to_json("Solution", "NumberOfEvents", solution.number_of_events());
    info.add_to_json("Solution", "Score", solution.score());
    info.add_to_json("Solution", "Time", time);
    info.os()
        << std::endl
        << "Final statistics" << std::endl
        << "----------------" << std::endl
        << "Time (s):                     " << time << std::endl
        ;
    info.os() << std::endl
        << "Solution" << std::endl
        << "--------" << std::endl ;
    solution.print(info.os(), info.verbosity_level());

    info.write_json_output();
    solution.write(info.output->certificate_path);
    return *this;
}

Output timetablingsolver::optimize(
        const Instance& instance,
        OptimizeOptionalParameters parameters)
{
    Output output(instance, parameters.info);

    MilpCbcOptionalParameters milp_cbc_parameters;
    MilpCbcOutput milp_cbc_output = milp_cbc(instance, milp_cbc_parameters);

    output.solution = milp_cbc_output.solution;
    output.display(parameters.info);

    return output.algorithm_end(parameters.info);
}
