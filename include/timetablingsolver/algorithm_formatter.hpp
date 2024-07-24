#pragma once

#include "timetablingsolver/solution.hpp"
#include "timetablingsolver/optimize.hpp"

#include <mutex>

namespace timetablingsolver
{

class AlgorithmFormatter
{

public:

    /** Constructor. */
    AlgorithmFormatter(
            const Instance& instance,
            const OptimizeParameters& parameters,
            timetablingsolver::Output& output):
        instance_(instance),
        parameters_(parameters),
        output_(output),
        os_(parameters.create_os()) { }

    /** Print the header. */
    void start();

    /** Print the header. */
    void print_header();

    /** Print current state. */
    void print(
            const std::string& s);

    /** Update the solution. */
    void update_solution(
            const Solution& solution,
            const std::string& s);

    /** Method to call at the end of the algorithm. */
    void end();

private:

    /** Instance. */
    const Instance& instance_;

    /** Parameters. */
    const OptimizeParameters& parameters_;

    /** Output. */
    Output& output_;

    /** Output stream. */
    std::unique_ptr<optimizationtools::ComposeStream> os_;

    /** Mutex. */
    std::mutex mutex_;

};

}
