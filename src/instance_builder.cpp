#include "timetablingsolver/instance_builder.hpp"

#include "nlohmann/json.hpp"

#include <fstream>

using namespace timetablingsolver;

void InstanceBuilder::set_horizon(Time horizon)
{
    instance_.is_time_step_used_ = std::vector<uint8_t>(horizon, 0);
    instance_.number_of_time_steps_used_ = 0;
    instance_.events_.clear();
    instance_.resources_.clear();
}

ResourceId InstanceBuilder::add_resource()
{
    ResourceId resource_id = instance_.resources_.size();
    Resource resource;
    resource.scores = std::vector<Score>(instance_.horizon(), -1);
    instance_.resources_.push_back(resource);
    return resource_id;
}

void InstanceBuilder::set_score(
        ResourceId resource_id,
        Time time,
        Score score)
{
    if (resource_id < -1 || resource_id >= instance_.number_of_resources()) {
        throw std::invalid_argument(
                "timetablingsolver::InstanceBuilder::set_score."
                " Invalid resource id: " + std::to_string(resource_id)
                + "; number of resources: " + std::to_string(instance_.number_of_resources())
                + ".");
    }
    if (time < 0 || time >= instance_.horizon()) {
        throw std::invalid_argument(
                "timetablingsolver::InstanceBuilder::set_score."
                " Invalid time: " + std::to_string(time)
                + "; horizon: " + std::to_string(instance_.horizon())
                + ".");
    }

    instance_.resources_[resource_id].scores[time] = score;
    if (instance_.is_time_step_used_[time] == 0) {
        instance_.is_time_step_used_[time] = 1;
        instance_.number_of_time_steps_used_++;
    }
}

void InstanceBuilder::set_default_score(
        Score default_score)
{
    default_score_ = -1;
}

EventId InstanceBuilder::add_event(
        Time duration)
{
    EventId event_id = instance_.events_.size();
    Event event;
    event.duration = duration;
    instance_.events_.push_back(event);
    return event_id;
}

void InstanceBuilder::add_resource(
        EventId event_id,
        ResourceId resource_id)
{
    instance_.resources_[resource_id].event_ids.push_back(event_id);
    instance_.events_[event_id].resource_ids.push_back(resource_id);
}

void InstanceBuilder::read(const std::string& instance_path)
{
    std::ifstream file(instance_path);
    if (!file.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + instance_path + "\".");
    }

    nlohmann ::json j;
    file >> j;

    // Read horizon.
    //std::cout << "Read horizon..." << std::endl;
    Time horizon = j["Horizon"];
    set_horizon(horizon);

    // Read default score.
    //std::cout << "Read default score..." << std::endl;
    if (j.contains("DefaultScore"))
        default_score_ = j["DefaultScore"];

    // Read resources.
    ResourceId number_of_resources = j["NumberOfResources"];
    //std::cout << "Read resources..." << std::endl;
    for (ResourceId resource_id = 0;
            resource_id < number_of_resources;
            ++resource_id) {
        add_resource();
    }

    // Read events.
    //std::cout << "Read events..." << std::endl;
    for (const auto& json_event: j["Events"]) {
        add_event(json_event["Duration"]);
    }

    // Read event resources.
    //std::cout << "Read event resources..." << std::endl;
    for (const auto& json_event_resource: j["EventResources"]) {
        add_resource(
                json_event_resource["Event"],
                json_event_resource["Resource"]);
    }

    // Read resource availabilities.
    //std::cout << "Read resource availabilities..." << std::endl;
    for (const auto& json_resource_availability: j["ResourceAvailabilities"]) {
        ResourceId resource_id = json_resource_availability["Resource"];
        Score score = json_resource_availability["Score"];
        for (Time time = json_resource_availability["Start"];
                time < json_resource_availability["End"];
                ++time) {
            set_score(
                    resource_id,
                    time,
                    score);
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Build /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

Instance InstanceBuilder::build()
{
    if (default_score_ != -1) {
        for (ResourceId resource_id = 0;
                resource_id < instance_.number_of_resources();
                ++resource_id) {
            for (Time time = 0;
                    time < instance_.horizon();
                    ++time) {
                if (instance_.resources_[resource_id].scores[time] == -1) {
                    instance_.resources_[resource_id].scores[time] = default_score_;
                }
            }
        }
    }
    return std::move(instance_);
}
