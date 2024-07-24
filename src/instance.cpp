#include "timetablingsolver/instance.hpp"

#include <iomanip>

using namespace timetablingsolver;

Score Instance::compute_score(
        ResourceId resource_id,
        EventId event_id,
        Time time) const
{
    if (time == -1)
        return 0;
    const Event& event = this->event(event_id);
    const Resource& resource = this->resource(resource_id);
    Score score = 0;
    for (Time t = time;
            t < time + event.duration;
            ++t) {
        score = std::max(score, resource.scores[t]);
    }
    return score;
}

Score Instance::compute_score(EventId event_id, Time time) const
{
    if (time == -1)
        return 0;
    const Event& event = this->event(event_id);
    Score score = 0;
    for (ResourceId resource_id: event.resource_ids)
        score += compute_score(resource_id, event_id, time);
    return score;
}

std::ostream& Instance::format(
        std::ostream& os,
        int verbosity_level) const
{
    if (verbosity_level >= 1) {
        os
            << "Number of events:           " << number_of_events() << std::endl
            << "Number of resources:        " << number_of_resources() << std::endl
            << "Horizon:                    " << horizon() << std::endl
            << "Number of time steps used:  " << number_of_time_steps_used_ << std::endl
            ;
    }

    if (verbosity_level >= 2) {
        // Print events.
        os
            << std::endl
            << std::setw(12) << "Event"
            << std::setw(12) << "Duration"
            << std::setw(12) << "# resources"
            << std::endl
            << std::setw(12) << "-----"
            << std::setw(12) << "--------"
            << std::setw(12) << "-----------"
            << std::endl;
        for (EventId event_id = 0;
                event_id < number_of_events();
                ++event_id) {
            const Event& event = this->event(event_id);
            os
                << std::setw(12) << event_id
                << std::setw(12) << event.duration
                << std::setw(12) << event.resource_ids.size()
                << std::endl;
        }

        // Print resources.
        os
            << std::endl
            << std::setw(12) << "Resource"
            << std::setw(12) << "# events"
            << std::endl
            << std::setw(12) << "--------"
            << std::setw(12) << "--------"
            << std::endl;
        for (ResourceId resource_id = 0;
                resource_id < number_of_resources();
                ++resource_id) {
            const Resource& resource = this->resource(resource_id);
            os
                << std::setw(12) << resource_id
                << std::setw(12) << resource.event_ids.size()
                << std::endl;
        }
    }

    if (verbosity_level >= 3) {
        // Print event resources.
        os
            << std::endl
            << std::setw(12) << "Event"
            << std::setw(12) << "Resource"
            << std::endl
            << std::setw(12) << "-----"
            << std::setw(12) << "--------"
            << std::endl;
        for (EventId event_id = 0;
                event_id < number_of_events();
                ++event_id) {
            const Event& event = this->event(event_id);
            for (ResourceId resource_id: event.resource_ids) {
                const Resource& resource = this->resource(resource_id);
                os
                    << std::setw(12) << event_id
                    << std::setw(12) << resource_id
                    << std::endl;
            }
        }
    }

    if (verbosity_level >= 4) {
        // Print scores.
        os
            << std::endl
            << std::setw(12) << "Resource"
            << std::setw(12) << "Time"
            << std::setw(12) << "Score"
            << std::endl
            << std::setw(12) << "--------"
            << std::setw(12) << "----"
            << std::setw(12) << "-----"
            << std::endl;
        for (ResourceId resource_id = 0;
                resource_id < number_of_resources();
                ++resource_id) {
            const Resource& resource = this->resource(resource_id);
            for (Time time = 0;
                    time < horizon();
                    ++time) {
                if (is_time_step_used_[time] == 0)
                    continue;
                os
                    << std::setw(12) << resource_id
                    << std::setw(12) << time
                    << std::setw(12) << resource.scores[time]
                    << std::endl;
            }
        }
    }

    return os;
}
