#pragma once

#include <vector>
#include <cstdint>
#include <iostream>

namespace timetablingsolver
{

using Time = int64_t;
using EventId = int64_t;
using ResourceId = int64_t;
using Score = int64_t;
using Capacity = int64_t;
using Counter = int64_t;
using Seed = int64_t;

/**
 * Structure for an event.
 */
struct Event
{
    /** Resources. */
    std::vector<ResourceId> resource_ids;

    /** Duration. */
    Time duration;
};

/**
 * Structure for a resource.
 */
struct Resource
{
    /** Events. */
    std::vector<EventId> event_ids;

    /**
     * For each day, for each time step of the day, the score of allocating an
     * event on this resource at this time step.
     *
     * scores[day][time]
     *
     * A value of -1 means that it is not allowed to allocated an event on this
     * resource at this time step.
     */
    std::vector<Score> scores;
};

/**
 * Instance class for a timetabling problem.
 */
class Instance
{

public:

    /*
     * Getters
     */

    /** Get the horizon. */
    Time horizon() const { return is_time_step_used_.size(); }

    /** Get the number of resources. */
    ResourceId number_of_resources() const { return resources_.size(); }

    /** Get a resource. */
    const Resource& resource(ResourceId resource_id) const { return resources_[resource_id]; }

    /** Get the number of events. */
    EventId number_of_events() const { return events_.size(); }

    /** Get a event. */
    const Event& event(EventId event_id) const { return events_[event_id]; }

    /** Return 'true' iff the time step is used. */
    bool is_time_step_used(Time time) const { return is_time_step_used_[time] == 1; }

    /**
     * Compute the score of scheduling a given event on a given resource at a
     * given time.
     */
    Score compute_score(
            ResourceId resource_id,
            EventId event_id,
            Time time) const;

    /**
     * Compute the overall score of scheduling a given event at a given time.
     */
    Score compute_score(
            EventId event_id,
            Time time) const;

    /*
     * Export
     */

    /** Print the instance into a stream. */
    std::ostream& format(
            std::ostream& os,
            int verbosity_level = 1) const;

private:

    /** Constructor. */
    Instance() { }

    /*
     * Private attributes
     */

    /**
     * 'is_time_step_used_[time]' is 1 iff there is at least one resource
     * available at time step 'time'.
     */
    std::vector<uint8_t> is_time_step_used_;

    /** Number of time steps used. */
    Time number_of_time_steps_used_ = 0;

    /** Resources. */
    std::vector<Resource> resources_;

    /** Events. */
    std::vector<Event> events_;

    friend class InstanceBuilder;

};

}
