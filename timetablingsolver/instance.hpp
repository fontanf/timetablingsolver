#pragma once

#include "optimizationtools/utils/info.hpp"
#include "optimizationtools/utils/utils.hpp"

#include <vector>
#include <cstdint>
#include <limits>

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
    /** Name. */
    std::string name;

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
    /** Name. */
    std::string name;

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

    /** Constructor. */
    Instance(Time horizon):
        is_time_step_used_(horizon, 0) { }

    /** Build an instance from a file. */
    Instance(
            std::string events_path,
            std::string resources_path,
            std::string event_resources_path,
            std::string parameters_path);

    /*
     * Resources
     */

    /** Add a new resource to the problem. */
    ResourceId add_resource(
            std::string name);

    /**
     * Set the score of allocating an event to a resource at a given time step.
     */
    void set_score(
            ResourceId resource_id,
            Time time,
            Score score);

    /*
     * Events
     */

    /** Add a new event to the problem. */
    EventId add_event(
            std::string name,
            Time duration);

    /** Add a resource to an event. */
    void add_resource(
            EventId event_id,
            ResourceId resource_id);

    /*
     * Getters.
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
    Score compute_score(EventId event_id, Time time) const;

    /** */
    std::string date2str(Time time) const;

    /** */
    std::string duration2str(Time time) const;

    /*
     * Export
     */

    /** Print the instance into a stream. */
    std::ostream& print(
            std::ostream& os,
            int verbose = 1) const;

private:

    /*
     * Private methods.
     */

    /** Read the parameters from a file. */
    void read_parameters(std::string parameters_path);

    /** Compute the horizon from the resource file. */
    void compute_horizon(std::string resources_path);

    /** Read the events from a file. */
    void read_events(std::string events_path);

    /** Read the resources from a file. */
    void read_resources(std::string resources_path);

    /** Read the event_resources from a file. */
    void read_event_resources(std::string event_resources_path);

    /** Convert a date to a time. */
    std::time_t str2date_abs(std::string time_str) const;

    /** Convert a date to a time. */
    Time str2date_floor(std::string time_str) const;

    /** Convert a date to a time. */
    Time str2date_ceil(std::string time_str) const;

    /** Convert a string to a duration. */
    std::time_t str2duration_abs(std::string time_str) const;

    /** Convert a string to a duration. */
    Time str2duration(std::string time_str) const;

    /*
     * Private attributes.
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

    /** Ids of the events from their names. */
    std::unordered_map<std::string, EventId> events_name_2_id_;

    /** Ids of the resources from their names. */
    std::unordered_map<std::string, ResourceId> resources_name_2_id_;

    mutable std::tm tm_duration_;

    mutable std::tm tm_date_;

    std::string locale_;

    std::string date_time_format_;

    std::string duration_format_;

    std::string duration_zero_str_;

    std::string time_step_str_;

    std::time_t duration_zero_;

    std::time_t time_step_;

    std::time_t date_min_ = std::numeric_limits<std::time_t>::max();

    std::time_t date_max_ = std::numeric_limits<std::time_t>::min();

};

}
