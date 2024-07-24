#include "timetablingsolver/solution.hpp"

#include "optimizationtools//utils//utils.hpp"

#include <iomanip>
#include <fstream>

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

/** Build a solution from a file. */
Solution::Solution(
        const Instance& instance,
        const std::string& certificate_path):
    Solution(instance)
{
    std::ifstream file(certificate_path);
    if (!file.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + certificate_path + "\".");
    }

    nlohmann ::json j;
    file >> j;

    // Read events.
    EventId event_id = 0;
    for (const auto& json_event: j["Schedule"]) {
        Time start = json_event["Start"];
        if (start >= 0)
            add_event(event_id, start);
        ++event_id;
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

bool Solution::operator<(const Solution& solution) const
{
    if (number_of_events() != solution.number_of_events())
        return number_of_events() > solution.number_of_events();
    return score() < solution.score();
}

std::ostream& Solution::format(
        std::ostream& os,
        int verbosity_level) const
{
    if (verbosity_level >= 1) {
        os
            << "Number of events:  " << optimizationtools::Ratio<EventId>(number_of_events(), instance().number_of_events()) << std::endl
            << "Score:             " << score() << std::endl
            ;
    }

    if (verbosity_level >= 2) {
        os << std::right << std::endl
            << std::setw(12) << "Event"
            << std::setw(12) << "Start"
            << std::setw(12) << "Duration"
            << std::setw(12) << "End"
            << std::setw(12) << "Score"
            << std::endl
            << std::setw(12) << "-----"
            << std::setw(12) << "-----"
            << std::setw(12) << "--------"
            << std::setw(12) << "---"
            << std::setw(12) << "-----"
            << std::endl;
        for (EventId event_id = 0;
                event_id < instance().number_of_events();
                ++event_id) {
            const Event& event = instance().event(event_id);
            os
                << std::setw(12) << event_id
                << std::setw(12) << events_[event_id].start
                << std::setw(12) << event.duration
                << std::setw(12) << events_[event_id].start + event.duration
                << std::setw(12) << instance().compute_score(event_id, events_[event_id].start)
                << std::endl;
        }
    }

    return os;
}

void Solution::write(const std::string& certificate_path) const
{
    if (certificate_path.empty())
        return;
    std::ofstream file(certificate_path);
    if (!file.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + certificate_path + "\".");
    }

    nlohmann::json json;

    for (EventId event_id = 0;
            event_id < instance().number_of_events();
            ++event_id) {
        const SolutionEvent& solution_event = this->event(event_id);
        const Event& event = instance().event(event_id);
        json["Schedule"][event_id]["Start"] = solution_event.start;
        if (solution_event.start != -1) {
            json["Schedule"][event_id]["End"] = solution_event.start + event.duration;
        } else {
            json["Schedule"][event_id]["End"] = -1;
        }
    }

    Counter pos = 0;
    for (ResourceId resource_id = 0;
            resource_id < instance().number_of_resources();
            ++resource_id) {
        const Resource& resource = instance().resource(resource_id);
        for (EventId event_id: resource.event_ids) {
            const SolutionEvent& solution_event = this->event(event_id);
            const Event& event = instance().event(event_id);
            json["Scores"][pos]["Resource"] = resource_id;
            json["Scores"][pos]["Event"] = event_id;
            if (solution_event.start != -1) {
                json["Scores"][pos]["Score"] = instance().compute_score(resource_id, event_id, solution_event.start);
            } else {
                json["Scores"][pos]["Score"] = -1;
            }
            pos++;
        }
    }

    file << std::setw(4) << json << std::endl;
}

nlohmann::json Solution::to_json() const
{
    return nlohmann::json {
        {"NumberOfEvents", number_of_events()},
        {"Score", score()},
    };
}
