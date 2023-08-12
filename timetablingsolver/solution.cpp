#include "timetablingsolver/solution.hpp"

using namespace timetablingsolver;

Solution::Solution(const Instance& instance):
    instance_(&instance),
    events_(instance.number_of_events()),
    resources_(instance.number_of_resources())
{
    for (ResourceId resource_id = 0;
            resource_id < instance.number_of_resources();
            ++resource_id) {
        resources_[resource_id].usage = std::vector<Capacity>(instance.horizon(), 0);
    }
}

void Solution::add_event(
        EventId event_id,
        Time start)
{
    // Update evetn.
    events_[event_id].start = start;
    // Update number_of_events_;
    number_of_events_++;
    // Update resource usage.
    for (Time time = start;
            time < start + instance().event(event_id).duration;
            ++time) {
        for (ResourceId resource_id: instance().event(event_id).resource_ids) {
            resources_[resource_id].usage[time]++;
        }
    }
    // Update score.
    score_ += instance().compute_score(event_id, start);
}

std::ostream& Solution::print(
        std::ostream& os,
        int verbose) const
{
    if (verbose >= 1) {
        os
            << "Number of events:     " << optimizationtools::Ratio<EventId>(number_of_events(), instance().number_of_events()) << std::endl
            << "Score:                " << score() << std::endl
            ;
    }

    if (verbose >= 2) {
        os << std::endl
            << std::setw(12) << "Event"
            << std::setw(8) << ""
            << std::setw(12) << "Duration"
            << std::setw(8) << ""
            << std::setw(36) << "Time"
            << std::setw(8) << "Score"
            << std::endl
            << std::setw(12) << "-----"
            << std::setw(8) << ""
            << std::setw(12) << "--------"
            << std::setw(8) << ""
            << std::setw(36) << "----"
            << std::setw(8) << "-----"
            << std::endl;
        for (EventId event_id = 0;
                event_id < instance().number_of_events();
                ++event_id) {
            const Event& event = instance().event(event_id);
            os
                << std::setw(12) << event_id
                << std::setw(8) << event.duration
                << std::setw(12) << instance().duration2str(event.duration)
                << std::setw(8) << events_[event_id].start
                << std::setw(36) << instance().date2str(events_[event_id].start)
                << std::setw(8) << instance().compute_score(event_id, events_[event_id].start)
                << std::endl;
        }
    }

    return os;
}

void Solution::write(std::string certificate_path) const
{
    if (certificate_path.empty())
        return;
    std::ofstream f(certificate_path);
    if (!f.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + certificate_path + "\".");
    }

    f << "Event,Start" << std::endl;
    for (EventId event_id = 0;
            event_id < number_of_events();
            ++event_id) {
        const SolutionEvent& solution_event = this->event(event_id);
        const Event& event = instance().event(event_id);
        f
            << event.name << ","
            << instance().date2str(solution_event.start) << std::endl;
    }
    f.close();
}
