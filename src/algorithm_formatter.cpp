#include "timetablingsolver/algorithm_formatter.hpp"

#include <iomanip>

using namespace timetablingsolver;

void AlgorithmFormatter::start()
{
    output_.json["Parameters"] = parameters_.to_json();

    if (parameters_.verbosity_level == 0)
        return;
    *os_
        << "=================================" << std::endl
        << "        TimetablingSolver        " << std::endl
        << "=================================" << std::endl
        << std::endl
        << "Instance" << std::endl
        << "--------" << std::endl;
    output_.solution.instance().format(*os_, parameters_.verbosity_level);
}

void AlgorithmFormatter::print_header()
{
    if (parameters_.verbosity_level == 0)
        return;
    *os_
        << std::endl
        << std::setw(12) << "Time"
        << std::setw(12) << "# events"
        << std::setw(6) << "Score"
        << std::setw(32) << "Comment"
        << std::endl
        << std::setw(12) << "----"
        << std::setw(12) << "--------"
        << std::setw(6) << "-----"
        << std::setw(32) << "-------"
        << std::endl;
}

void AlgorithmFormatter::print(
        const std::string& s)
{
    if (parameters_.verbosity_level == 0)
        return;
    std::streamsize precision = std::cout.precision();

    *os_
        << std::setw(12) << std::fixed << std::setprecision(3) << output_.time << std::defaultfloat << std::setprecision(precision)
        << std::setw(12) << output_.solution.number_of_events()
        << std::setw(6) << output_.solution.score()
        << std::setw(32) << s
        << std::endl;
}

void AlgorithmFormatter::update_solution(
        const Solution& solution,
        const std::string& s)
{
    mutex_.lock();
    output_.time = parameters_.timer.elapsed_time();
    if (solution < output_.solution) {
        output_.solution = solution;
        print(s);
        output_.json["IntermediaryOutputs"].push_back(output_.to_json());
        // TODO
        //parameters_.new_solution_callback(output_);
    }
    mutex_.unlock();
}

void AlgorithmFormatter::end()
{
    output_.time = parameters_.timer.elapsed_time();
    output_.json["Output"] = output_.to_json();

    if (parameters_.verbosity_level == 0)
        return;
    *os_
        << std::endl
        << "Final statistics" << std::endl
        << "----------------" << std::endl;
    output_.format(*os_);
    *os_
        << std::endl
        << "Solution" << std::endl
        << "--------" << std::endl;
    output_.solution.format(*os_, parameters_.verbosity_level);
}
