#pragma once

#include "timetablingsolver/instance.hpp"

#include <set>

namespace timetablingsolver
{

/**
 * Structure for an event scheduled in a solution.
 */
struct SolutionEvent
{
    /** Start time. */
    Time start = -1;
};

/**
 * Structure for a resource in a solution.
 */
struct SolutionResource
{
    /** Usage for each time step. */
    std::vector<Capacity> usage;
};

/**
 * Solution class for a timetabling problem.
 */
class Solution
{

public:

    /** Constructor. */
    Solution(const Instance& instance);

    /** Insert a visit into the solution. */
    void add_event(
            EventId event_id,
            Time start);

    /*
     * Getters
     */

    /** Get the instance of the solution. */
    const Instance& instance() const { return *instance_; }

    /** Get the number of events scheduled in the solution. */
    EventId number_of_events() const { return number_of_events_; }

    /** Get an event. */
    const SolutionEvent& event(EventId event_id) const { return events_[event_id]; }

    /** Get the score of the solution. */
    Score score() const { return score_; }

    /*
     * Export
     */

    /** Print the instance. */
    std::ostream& print(
            std::ostream& os,
            int verbose = 1) const;

    /** Write the solution to a file. */
    void write(std::string certificate_path) const;

    /** Write a file containing the score of each event of each resource. */
    void write_scores(std::string file_path) const;

private:

    /** Instance. */
    const Instance* instance_;

    /** Number of events. */
    EventId number_of_events_ = 0;

    /** Events. */
    std::vector<SolutionEvent> events_;

    /** Resources. */
    std::vector<SolutionResource> resources_;

    /** Score. */
    Score score_ = 0;

};

}

