/**
 * WebAssembly module: JavaScript API of TimetablingSolver.
 *
 * The instance is built with the 'InstanceBuilder' class, which wraps the C++
 * 'InstanceBuilder', then solved with 'optimize':
 *
 *     const module = await TimetablingSolver();
 *     const builder = new module.InstanceBuilder();
 *     builder.setHorizon(8);
 *     builder.setDefaultScore(10);
 *     const teacher = builder.addResource();
 *     const student = builder.addResource();
 *     for (let time = 0; time < 8; ++time)
 *         builder.setScore(teacher, time, 0);
 *     builder.setScore(student, 2, 0);
 *     builder.setScore(student, 3, 1);
 *     const course = builder.addEvent(2);
 *     builder.addEventResource(course, teacher);
 *     builder.addEventResource(course, student);
 *     const result = module.optimize(builder, {timeLimit: 10});
 *     builder.delete();
 *
 * 'setHorizon' resets the instance: call it first. The time steps not given
 * a score with 'setScore' are unavailable: they get the default score, so
 * that the solver uses them only if there is no other way to schedule the
 * events.
 *
 * 'optimize' blocks the calling thread: in a browser, call it from a Web
 * Worker (the main thread can't block). It consumes the builder: the builder
 * can't be used anymore afterwards.
 *
 * Parameters (all optional):
 * - "timeLimit": time limit in seconds;
 * - "verbosityLevel": verbosity level, printed on the console.
 *
 * Result:
 *
 *     {
 *         "numberOfScheduledEvents": ...,
 *         "score": ...,  // sum of the scores, lower is better
 *         "time": ...,   // in seconds
 *         "events": [    // in the order of 'addEvent'
 *             {
 *                 "start": ...,  // null if the event isn't scheduled
 *                 "end": ...,    // null if the event isn't scheduled
 *                 "resources": [ // in the order of 'addEventResource'
 *                     {
 *                         "resource": ...,
 *                         "score": ...,      // null if the event isn't scheduled
 *                         "available": ...   // false if the event is scheduled
 *                                            // on a time step not given a
 *                                            // score for this resource
 *                     }
 *                 ]
 *             }
 *         ]
 *     }
 *
 * Invalid inputs throw JavaScript 'Error's.
 */

#include "timetablingsolver/instance_builder.hpp"
#include "timetablingsolver/optimize.hpp"

#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace timetablingsolver;
using emscripten::val;

namespace
{

/**
 * Call 'function', converting the C++ exceptions into JavaScript errors: C++
 * exceptions only reach JavaScript as opaque objects.
 */
template <typename Function>
auto call(const char* method, Function function) -> decltype(function())
{
    try {
        return function();
    } catch (const std::exception& e) {
        val::global("Error").new_(std::string(method) + ": " + e.what()).throw_();
    }
}

class JsInstanceBuilder
{

public:

    void set_horizon(int horizon)
    {
        call("setHorizon", [this, horizon]()
        {
            check_not_built();
            if (horizon < 0) {
                throw std::invalid_argument(
                        "invalid horizon: " + std::to_string(horizon) + ".");
            }
            instance_builder_.set_horizon(horizon);
            horizon_ = horizon;
            is_available_.clear();
        });
    }

    void set_default_score(int default_score)
    {
        call("setDefaultScore", [this, default_score]()
        {
            check_not_built();
            instance_builder_.set_default_score(default_score);
        });
    }

    int add_resource()
    {
        return call("addResource", [this]()
        {
            check_not_built();
            ResourceId resource_id = instance_builder_.add_resource();
            is_available_.push_back(std::vector<uint8_t>(horizon_, 0));
            return (int)resource_id;
        });
    }

    void set_score(int resource_id, int time, int score)
    {
        call("setScore", [this, resource_id, time, score]()
        {
            check_not_built();
            if (score < 0) {
                throw std::invalid_argument(
                        "invalid score: " + std::to_string(score)
                        + "; the score must be non-negative.");
            }
            instance_builder_.set_score(resource_id, time, score);
            is_available_[resource_id][time] = 1;
        });
    }

    int add_event(int duration)
    {
        return call("addEvent", [this, duration]()
        {
            check_not_built();
            return (int)instance_builder_.add_event(duration);
        });
    }

    void add_event_resource(int event_id, int resource_id)
    {
        call("addEventResource", [this, event_id, resource_id]()
        {
            check_not_built();
            instance_builder_.add_resource(event_id, resource_id);
        });
    }

    /** Build the instance; the builder can't be used anymore afterwards. */
    Instance build()
    {
        check_not_built();
        built_ = true;
        return instance_builder_.build();
    }

    /**
     * Return 'true' iff the resource was given a score on every time step
     * of the interval.
     */
    bool is_available(
            ResourceId resource_id,
            Time start,
            Time end) const
    {
        for (Time time = start; time < end; ++time)
            if (!is_available_[resource_id][time])
                return false;
        return true;
    }

private:

    void check_not_built() const
    {
        if (built_) {
            throw std::logic_error(
                    "the builder was already used by 'optimize'.");
        }
    }

    /** Builder of the library. */
    InstanceBuilder instance_builder_;

    /** Horizon. */
    Time horizon_ = 0;

    /**
     * 'is_available_[resource_id][time]' is 1 iff the resource was given a
     * score at this time step.
     */
    std::vector<std::vector<uint8_t>> is_available_;

    /** 'true' once the instance is built. */
    bool built_ = false;

};

OptimizeParameters read_parameters(const val& js_parameters)
{
    OptimizeParameters parameters;
    parameters.verbosity_level = 0;
    if (js_parameters.isUndefined() || js_parameters.isNull())
        return parameters;
    val time_limit = js_parameters["timeLimit"];
    if (!time_limit.isUndefined())
        parameters.timer.set_time_limit(time_limit.as<double>());
    val verbosity_level = js_parameters["verbosityLevel"];
    if (!verbosity_level.isUndefined())
        parameters.verbosity_level = verbosity_level.as<int>();
    return parameters;
}

val js_optimize(
        JsInstanceBuilder& builder,
        const val& js_parameters)
{
    return call("optimize", [&builder, &js_parameters]()
    {
        const Instance instance = builder.build();
        OptimizeParameters parameters = read_parameters(js_parameters);
        // The timer starts when the parameters are constructed; start it now.
        parameters.timer.reset_time();
        const Output output = timetablingsolver::optimize(instance, parameters);
        const Solution& solution = output.solution;

        val events = val::array();
        for (EventId event_id = 0;
                event_id < instance.number_of_events();
                ++event_id) {
            const Event& event = instance.event(event_id);
            Time start = solution.event(event_id).start;
            Time end = start + event.duration;
            val resources = val::array();
            for (ResourceId resource_id: event.resource_ids) {
                val resource = val::object();
                resource.set("resource", (int)resource_id);
                if (start == -1) {
                    resource.set("score", val::null());
                    resource.set("available", true);
                } else {
                    resource.set("score", (double)instance.compute_score(
                                resource_id, event_id, start));
                    resource.set("available", builder.is_available(
                                resource_id, start, end));
                }
                resources.call<void>("push", resource);
            }
            val js_event = val::object();
            js_event.set("start", (start == -1)? val::null(): val((double)start));
            js_event.set("end", (start == -1)? val::null(): val((double)end));
            js_event.set("resources", resources);
            events.call<void>("push", js_event);
        }

        val result = val::object();
        result.set("numberOfScheduledEvents", (double)solution.number_of_events());
        result.set("score", (double)solution.score());
        result.set("time", output.time);
        result.set("events", events);
        return result;
    });
}

}

EMSCRIPTEN_BINDINGS(timetablingsolver)
{
    emscripten::class_<JsInstanceBuilder>("InstanceBuilder")
        .constructor<>()
        .function("setHorizon", &JsInstanceBuilder::set_horizon)
        .function("setDefaultScore", &JsInstanceBuilder::set_default_score)
        .function("addResource", &JsInstanceBuilder::add_resource)
        .function("setScore", &JsInstanceBuilder::set_score)
        .function("addEvent", &JsInstanceBuilder::add_event)
        .function("addEventResource", &JsInstanceBuilder::add_event_resource);
    emscripten::function("optimize", &js_optimize);
}
