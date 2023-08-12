#include "timetablingsolver/instance.hpp"

using namespace timetablingsolver;

std::time_t Instance::str2date_abs(std::string time_str) const
{
    std::istringstream ss(time_str);
    ss.imbue(std::locale(locale_));
    ss >> std::get_time(&tm_date_, date_time_format_.c_str());
    tm_date_.tm_isdst = 0;
    return std::mktime(&tm_date_) - timezone;
}

Time Instance::str2date_floor(std::string time_str) const
{
    Time time = (str2date_abs(time_str) - date_min_) / time_step_;
    return time;
}

Time Instance::str2date_ceil(std::string time_str) const
{
    Time time = (str2date_abs(time_str) - date_min_ - 1) / time_step_ + 1;
    return time;
}

std::time_t Instance::str2duration_abs(std::string time_str) const
{
    std::istringstream ss(time_str);
    ss.imbue(std::locale(locale_));
    ss >> std::get_time(&tm_duration_, duration_format_.c_str());
    tm_duration_.tm_isdst = 0;
    return std::mktime(&tm_duration_);
}

Time Instance::str2duration(std::string time_str) const
{
    //std::cout << "str2duration_abs(time_str)" << str2duration_abs(time_str) << std::endl;
    //std::cout << "diff " << str2duration_abs(time_str) - duration_zero_ << std::endl;
    return (str2duration_abs(time_str) - duration_zero_ - 1) / time_step_ + 1;
}

std::string Instance::date2str(Time time) const
{
    if (time == -1)
        return "";
    if (date_time_format_.empty())
        return std::to_string(time);
    Time t = (time * time_step_) + date_min_;
    std::stringstream ss;
    ss.imbue(std::locale(locale_));
    ss << std::put_time(std::gmtime(&t), date_time_format_.c_str());
    return ss.str();
}

std::string Instance::duration2str(Time time) const
{
    if (date_time_format_.empty())
        return std::to_string(time);
    Time t = (time * time_step_);
    std::stringstream ss;
    ss.imbue(std::locale(locale_));
    ss << std::put_time(std::gmtime(&t), duration_format_.c_str());
    return ss.str();
}

Instance::Instance(
            std::string events_path,
            std::string resources_path,
            std::string event_resources_path,
            std::string parameters_path)
{
    tm_duration_.tm_year = 2023;
    tm_duration_.tm_mon = 1;
    tm_duration_.tm_mday = 1;
    read_parameters(parameters_path);
    compute_horizon(resources_path);
    read_events(events_path);
    read_resources(resources_path);
    read_event_resources(event_resources_path);
}

void Instance::read_parameters(std::string parameters_path)
{
    std::ifstream parameters_file(parameters_path);
    if (!parameters_file.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + parameters_path + "\".");
    }

    std::string tmp;
    std::vector<std::string> line;
    std::vector<std::string> labels;

    getline(parameters_file, tmp);
    labels = optimizationtools::split(tmp, ',');
    while (getline(parameters_file, tmp)) {
        line = optimizationtools::split(tmp, ',');

        std::string name;
        std::string value;

        for (Counter c = 0; c < (Counter)line.size(); ++c) {
            if (labels[c] == "Name"
                    || labels[c] == "Nom") {
                name = line[c];
            } else if (labels[c] == "Value"
                    || labels[c] == "Valeur") {
                value = line[c];
            }
        }

        if (name == "Locale") {
            locale_ = value;
        } else if (name == "Date time format"
                || name == "Format de dates") {
            date_time_format_ = value;
        } else if (name == "Duration format"
                || name == "Format de durées") {
            duration_format_ = value;
        } else if (name == "Duration zero"
                || name == "Durée zéro") {
            duration_zero_str_ = value;
        } else if (name == "Time step"
                || name == "Pas de temps") {
            time_step_str_ = value;
        }
    }

    duration_zero_ = str2duration_abs(duration_zero_str_);

    time_step_ = str2duration_abs(time_step_str_) - duration_zero_;
    //std::cout << "locale_ " << locale_ << std::endl;
    //std::cout << "date_time_format_ " << date_time_format_ << std::endl;
    //std::cout << "duration_format_ " << duration_format_ << std::endl;
    //std::cout << "duration_zero_str_ " << duration_zero_str_ << std::endl;
    //std::cout << "duration_zero_ " << duration_zero_ << std::endl;
    //std::cout << "time_step_str_ " << time_step_str_ << std::endl;
    //std::cout << "time_step_ " << time_step_ << std::endl;
}

void Instance::compute_horizon(std::string resources_path)
{
    std::string tmp;
    std::vector<std::string> line;
    std::vector<std::string> labels;

    std::ifstream resources_file(resources_path);
    if (!resources_file.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + resources_path + "\".");
    }

    getline(resources_file, tmp);
    labels = optimizationtools::split(tmp, ',');
    while (getline(resources_file, tmp)) {
        line = optimizationtools::split(tmp, ',');

        std::string name;
        std::string day;
        std::string start_str;
        std::string end_str;

        for (Counter i = 0; i < (Counter)line.size(); ++i) {
            if (labels[i] == "Name"
                    || labels[i] == "Nom") {
                name = line[i];
            } else if (labels[i] == "Start"
                    || labels[i] == "Début") {
                start_str = line[i];
            } else if (labels[i] == "End"
                    || labels[i] == "Fin") {
                end_str = line[i];
            }
        }

        std::time_t date_start = str2date_abs(start_str);
        std::time_t date_end = str2date_abs(end_str);
        //std::cout << "start_str   " << start_str << std::endl;
        //std::cout << "end_str     " << end_str << std::endl;
        //std::cout << "date_start  " << date_start << std::endl;
        //std::cout << "date_end    " << date_end << std::endl;

        date_min_ = std::min(date_min_, date_start);
        date_max_ = std::max(date_max_, date_end);
    }

    //std::cout << "date_max_ " << date_max_ << std::endl;
    //std::cout << "date_min_ " << date_min_ << std::endl;
    //std::cout << "diff " << date_max_ - date_min_ << std::endl;
    Time horizon = (date_max_ - date_min_ - 1) / time_step_ + 1 + 1;
    //std::cout << "horizon " << horizon << std::endl;
    is_time_step_used_ = std::vector<uint8_t>(horizon, 0);
}

void Instance::read_events(std::string events_path)
{
    std::ifstream events_file(events_path);
    if (!events_file.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + events_path + "\".");
    }

    std::string tmp;
    std::vector<std::string> line;
    std::vector<std::string> labels;

    getline(events_file, tmp);
    labels = optimizationtools::split(tmp, ',');
    while (getline(events_file, tmp)) {
        line = optimizationtools::split(tmp, ',');

        std::string name;
        std::string duration_str;

        for (Counter i = 0; i < (Counter)line.size(); ++i) {
            if (labels[i] == "Name"
                    || labels[i] == "Nom") {
                name = line[i];
            } else if (labels[i] == "Duration"
                    || labels[i] == "Durée") {
                duration_str = line[i];
            }
        }

        Time duration = str2duration(duration_str);
        //std::cout << "duration_str  " << duration_str << std::endl;
        //std::cout << "duration " << duration << std::endl;
        add_event(name, duration);
    }
}

void Instance::read_resources(std::string resources_path)
{
    std::ifstream resources_file(resources_path);
    if (!resources_file.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + resources_path + "\".");
    }

    std::string tmp;
    std::vector<std::string> line;
    std::vector<std::string> labels;

    getline(resources_file, tmp);
    labels = optimizationtools::split(tmp, ',');
    while (getline(resources_file, tmp)) {
        line = optimizationtools::split(tmp, ',');

        std::string name;
        std::string start_str;
        std::string end_str;
        Score score = 0;

        for (Counter i = 0; i < (Counter)line.size(); ++i) {
            if (labels[i] == "Name"
                    || labels[i] == "Nom") {
                name = line[i];
            } else if (labels[i] == "Start"
                    || labels[i] == "Début") {
                start_str = line[i];
            } else if (labels[i] == "End"
                    || labels[i] == "Fin") {
                end_str = line[i];
            } else if (labels[i] == "Score") {
                score = (Score)std::stol(line[i]);
            }
        }

        if (resources_name_2_id_.find(name) == resources_name_2_id_.end()) {
            add_resource(name);
        }

        ResourceId resource_id = resources_name_2_id_[name];
        Time start = str2date_floor(start_str);
        Time end = str2date_ceil(end_str);
        for (Time time = start; time < end; ++time) {
            set_score(
                    resource_id,
                    time,
                    score);
        }
    }

    for (ResourceId resource_id = 0;
            resource_id < number_of_resources();
            ++resource_id) {

        Score score_max = 0;
        for (Time time = 0;
                time < horizon();
                ++time) {
            if (is_time_step_used_[time] == 0)
                continue;
            score_max = std::max(
                    score_max,
                    resource(resource_id).scores[time]);
        }

        for (Time time = 0;
                time < horizon();
                ++time) {
            if (is_time_step_used_[time] == 0)
                continue;
            if (resource(resource_id).scores[time] == -1) {
                resources_[resource_id].scores[time] = score_max + 2;
            }
        }
    }
}

void Instance::read_event_resources(std::string event_resources_path)
{
    std::ifstream event_resources_file(event_resources_path);
    if (!event_resources_file.good()) {
        throw std::runtime_error(
                "Unable to open file \"" + event_resources_path + "\".");
    }

    std::string tmp;
    std::vector<std::string> line;
    std::vector<std::string> labels;

    getline(event_resources_file, tmp);
    labels = optimizationtools::split(tmp, ',');
    while (getline(event_resources_file, tmp)) {
        line = optimizationtools::split(tmp, ',');

        std::string event_name;
        std::string resource_name;

        for (Counter i = 0; i < (Counter)line.size(); ++i) {
            if (labels[i] == "Event"
                    || labels[i] == "Événement") {
                event_name = line[i];
            } else if (labels[i] == "Resource"
                    || labels[i] == "Ressource") {
                resource_name = line[i];
            }
        }

        EventId event_id = events_name_2_id_[event_name];
        ResourceId resource_id = resources_name_2_id_[resource_name];
        add_resource(event_id, resource_id);
    }
}

ResourceId Instance::add_resource(
        std::string name)
{
    ResourceId resource_id = resources_.size();
    Resource resource;
    resource.name = name;
    resource.scores = std::vector<Score>(horizon(), -1);
    resources_.push_back(resource);
    resources_name_2_id_[name] = resource_id;
    return resource_id;
}

void Instance::set_score(
        ResourceId resource_id,
        Time time,
        Score score)
{
    resources_[resource_id].scores[time] = score;
    if (is_time_step_used_[time] == 0) {
        is_time_step_used_[time] = 1;
        number_of_time_steps_used_++;
    }
}

EventId Instance::add_event(
            std::string name,
            Time duration)
{
    EventId event_id = events_.size();
    Event event;
    event.name = name;
    event.duration = duration;
    events_.push_back(event);
    events_name_2_id_[name] = event_id;
    return event_id;
}

void Instance::add_resource(
        EventId event_id,
        ResourceId resource_id)
{
    resources_[resource_id].event_ids.push_back(event_id);
    events_[event_id].resource_ids.push_back(resource_id);
}

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

std::ostream& Instance::print(
        std::ostream& os,
        int verbose) const
{
    if (verbose >= 1) {
        os
            << "Number of events:           " << number_of_events() << std::endl
            << "Number of resources:        " << number_of_resources() << std::endl
            << "Horizon:                    " << horizon() << std::endl
            << "Number of time steps used:  " << number_of_time_steps_used_ << std::endl
            ;
    }

    if (verbose >= 2) {
        // Print events.
        os
            << std::endl
            << std::setw(12) << "Event"
            << std::setw(8) << ""
            << std::setw(12) << "Duration"
            << std::setw(12) << "# resources"
            << std::endl
            << std::setw(12) << "-----"
            << std::setw(8) << ""
            << std::setw(12) << "--------"
            << std::setw(12) << "-----------"
            << std::endl;
        for (EventId event_id = 0;
                event_id < number_of_events();
                ++event_id) {
            const Event& event = this->event(event_id);
            os
                << std::setw(12) << event_id
                << std::setw(8) << event.duration
                << std::setw(12) << duration2str(event.duration)
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

    if (verbose >= 3) {
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
                os
                    << std::setw(12) << event_id
                    << std::setw(12) << resource_id
                    << std::endl;
            }
        }
    }

    if (verbose >= 4) {
        // Print scores.
        os
            << std::endl
            << std::setw(12) << "Resource"
            << std::setw(8) << ""
            << std::setw(36) << "Time"
            << std::setw(12) << "Score"
            << std::endl
            << std::setw(12) << "--------"
            << std::setw(8) << ""
            << std::setw(36) << "----"
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
                    << std::setw(8) << time
                    << std::setw(36) << date2str(time)
                    << std::setw(12) << resource.scores[time]
                    << std::endl;
            }
        }
    }

    return os;
}
