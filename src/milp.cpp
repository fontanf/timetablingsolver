#include "milp.hpp"

#include "interfaces/highs_c_api.h"

using namespace timetablingsolver;

MilpOutput timetablingsolver::milp(
        const Instance& instance,
        const MilpParameters& parameters)
{
    MilpOutput output(instance);

    for (Counter objective_id = 0;
            objective_id < 2;
            ++objective_id) {

        std::vector<double> column_lower_bounds;
        std::vector<double> column_upper_bounds;
        std::vector<HighsInt> column_types;
        std::vector<double> objective;

        std::vector<double> row_lower_bounds;
        std::vector<double> row_upper_bounds;

        // Define the constraint matrix column-wise
        const HighsInt a_format = kHighsMatrixFormatRowwise;
        std::vector<HighsInt> a_start;
        std::vector<HighsInt> a_index;
        std::vector<double> a_value;

        std::vector<HighsInt> x0(instance.number_of_events(), -1);
        std::vector<HighsInt> x01(instance.horizon(), -1);
        std::vector<std::vector<HighsInt>> x(
                instance.number_of_events(),
                std::vector<HighsInt>(instance.horizon(), -1));

        // Variables and objective.
        for (EventId event_id = 0;
                event_id < instance.number_of_events();
                ++event_id) {
            const Event& event = instance.event(event_id);
            for (Time time = 0;
                    time < instance.horizon() - event.duration + 1;
                    ++time) {

                bool ok = true;
                for (Time t = time;
                        t < time + event.duration;
                        ++t) {
                    if (!instance.is_time_step_used(t)) {
                        ok = false;
                        break;
                    }
                }
                if (!ok)
                    continue;

                if (objective_id == 0) {
                    objective.push_back(1);
                } else if (objective_id == 1) {
                    objective.push_back(instance.compute_score(event_id, time));
                }

                x[event_id][time] = column_lower_bounds.size();
                column_lower_bounds.push_back(0);
                column_upper_bounds.push_back(1);
                column_types.push_back(1);
            }
        }

        // Constraints
        // will be increased each time we add a constraint
        int number_of_rows = 0;
        std::vector<int> number_of_elements_in_rows;

        // An event can be scheduled at most once.
        for (EventId event_id = 0;
                event_id < instance.number_of_events();
                ++event_id) {
            // Initialize new row
            a_start.push_back(a_value.size());
            number_of_elements_in_rows.push_back(0);
            number_of_rows++;
            // Add row elements.
            for (Time time = 0;
                    time < instance.horizon();
                    ++time) {
                if (x[event_id][time] == -1)
                    continue;
                a_value.push_back(1);
                a_index.push_back(x[event_id][time]);
                number_of_elements_in_rows.back()++;
            }
            // Add row bounds
            row_lower_bounds.push_back(0);
            row_upper_bounds.push_back(1);
        }

        // Resource capacity.
        for (ResourceId resource_id = 0;
                resource_id < instance.number_of_resources();
                ++resource_id) {
            const Resource& resource = instance.resource(resource_id);
            for (Time time = 0; time < instance.horizon(); ++time) {
                if (!instance.is_time_step_used(time))
                    continue;
                // Initialize new row
                a_start.push_back(a_value.size());
                number_of_elements_in_rows.push_back(0);
                number_of_rows++;
                // Add row elements.
                for (EventId event_id: resource.event_ids) {
                    const Event& event = instance.event(event_id);
                    for (Time t = std::max((Time)0, time - event.duration + 1);
                            t <= time;
                            ++t) {
                        if (x[event_id][t] == -1)
                            continue;
                        a_value.push_back(1);
                        a_index.push_back(x[event_id][t]);
                        number_of_elements_in_rows.back()++;
                    }
                }
                // Add row bounds
                row_lower_bounds.push_back(0);
                row_upper_bounds.push_back(1);
            }
        }

        // If objective_id == 1, minimum number of events scheduled.
        if (objective_id == 1) {
            // Initialize new row
            a_start.push_back(a_value.size());
            number_of_elements_in_rows.push_back(0);
            number_of_rows++;
            // Add row elements.
            for (EventId event_id = 0;
                    event_id < instance.number_of_events();
                    ++event_id) {
                for (Time time = 0;
                        time < instance.horizon();
                        ++time) {
                    if (x[event_id][time] == -1)
                        continue;
                    a_value.push_back(1);
                    a_index.push_back(x[event_id][time]);
                    number_of_elements_in_rows.back()++;
                }
            }
            // Add row bounds
            row_lower_bounds.push_back(output.solution.number_of_events());
            row_upper_bounds.push_back(output.solution.number_of_events());
        }

        // Set objective sense.
        HighsInt sense = kHighsObjSenseMinimize;
        if (objective_id == 0) {
            // Maximize (the number of events scheduled).
            sense = kHighsObjSenseMaximize;
        } else if (objective_id == 1) {
            // Minimize (score).
            sense = kHighsObjSenseMinimize;
        }

        double offset = 0.0;

        // Create a Highs instance
        void* highs = Highs_create();

        // Pass the MIP to HIGHS.
        Highs_passMip(
                highs,
                column_lower_bounds.size(),
                row_lower_bounds.size(),
                a_value.size(),
                a_format,
                sense,
                offset,
                objective.data(),
                column_lower_bounds.data(),
                column_upper_bounds.data(),
                row_lower_bounds.data(),
                row_upper_bounds.data(),
                a_start.data(),
                a_index.data(),
                a_value.data(),
                column_types.data());

        // Add initial solution.
        if (objective_id != 0) {
            std::vector<double> sol_init(column_lower_bounds.size(), 0);
            for (EventId event_id = 0;
                    event_id < instance.number_of_events();
                    ++event_id) {
                if (output.solution.event(event_id).start != -1)
                    sol_init[x[event_id][output.solution.event(event_id).start]] = 1;
            }
            //model.setBestSolution(
            //        sol_init.data(),
            //        number_of_columns,
            //        COIN_DBL_MAX,
            //        true);
        }

        // Set time limit.
        if (parameters.timer.remaining_time() < std::numeric_limits<double>::infinity()) {
            Highs_setDoubleOptionValue(
                    highs,
                    "time_limit",
                    parameters.timer.remaining_time());
        }

        // Set maximum number of nodes.
        if (parameters.maximum_number_of_nodes != -1) {
            Highs_setIntOptionValue(
                    highs,
                    "mip_max_nodes",
                    parameters.maximum_number_of_nodes);
        }

        // Reduce printout.
        Highs_setBoolOptionValue(
                highs,
                "log_to_console",
                false);

        // Solve the incumbent model
        HighsInt run_status = Highs_run(highs);

        HighsInt model_status = Highs_getModelStatus(highs);
        HighsInt primal_solution_status = -1;
        Highs_getIntInfoValue(highs, "primal_solution_status", &primal_solution_status);

        if (model_status == kHighsModelStatusInfeasible) {
            // Infeasible.
            // Something's wrong.
            throw std::runtime_error("The model shouldn't be infeasible.");

        } else if (model_status == kHighsModelStatusOptimal
                || primal_solution_status == kHighsSolutionStatusFeasible) {
            // Optimal or feasible solution found.

            // Retrieve solution.
            std::vector<double> column_values(column_lower_bounds.size(), 0.0);
            std::vector<double> column_duals(column_lower_bounds.size(), 0.0);
            std::vector<double> row_values(row_lower_bounds.size(), 0.0);
            std::vector<double> row_duals(row_lower_bounds.size(), 0.0);
            HighsInt highs_return_code = Highs_getSolution(
                    highs,
                    column_values.data(),
                    column_duals.data(),
                    row_values.data(),
                    row_duals.data());

            Solution solution(instance);
            for (EventId event_id = 0;
                    event_id < instance.number_of_events();
                    ++event_id) {
                const Event& event = instance.event(event_id);
                for (Time time = 0;
                        time < instance.horizon() - event.duration + 1;
                        ++time) {
                    if (x[event_id][time] == -1)
                        continue;
                    if (column_values[x[event_id][time]] > 0.5) {
                        solution.add_event(event_id, time);
                    }
                }
            }
            output.solution = solution;
        } else {
            // No feasible solution found.
            return output;
        }
    }

    return output;
}
