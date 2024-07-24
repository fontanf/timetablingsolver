#pragma once

#include "timetablingsolver/instance.hpp"

namespace timetablingsolver
{

class InstanceBuilder
{

public:

    /** Constructor. */
    InstanceBuilder() { }

    /**
     * Set horizon.
     *
     * This method reset the instance.
     */
    void set_horizon(Time horizon);

    /** Add a new resource to the problem. */
    ResourceId add_resource();

    /**
     * Set the score of allocating an event to a resource at a given time step.
     */
    void set_score(
            ResourceId resource_id,
            Time time,
            Score score);

    /** Set the default score. */
    void set_default_score(
            Score default_score);

    /** Add a new event to the problem. */
    EventId add_event(
            Time duration);

    /** Add a resource to an event. */
    void add_resource(
            EventId event_id,
            ResourceId resource_id);

    /** Read an instance from a file. */
    void read(const std::string& instance_path);

    /*
     * Build
     */

    /** Build. */
    Instance build();

private:

    /*
     * Private attributes
     */

    /** Instance. */
    Instance instance_;

    /** Default score. */
    Score default_score_ = -1;

};

}
