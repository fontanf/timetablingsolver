#if CBC_FOUND

#include "timetablingsolver/milp.hpp"

#include <cstdio>

#include <CbcModel.hpp>
#include <OsiCbcSolverInterface.hpp>

using namespace timetablingsolver;

MilpCbcOutput timetablingsolver::milp_cbc(
        const Instance& instance,
        MilpCbcOptionalParameters parameters)
{
    MilpCbcOutput output(instance);

    for (Counter objective_id = 0;
            objective_id < 2;
            ++objective_id) {

        std::vector<double> column_lower_bounds;
        std::vector<double> column_upper_bounds;
        std::vector<double> objective;

        std::vector<double> row_lower_bounds;
        std::vector<double> row_upper_bounds;
        CoinPackedMatrix matrix;

        std::vector<int> x0(instance.number_of_events(), -1);
        std::vector<int> x01(instance.horizon(), -1);
        std::vector<std::vector<int>> x(
                instance.number_of_events(),
                std::vector<int>(instance.horizon(), -1));
        int number_of_columns = 0;

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

                x[event_id][time] = number_of_columns;
                column_lower_bounds.push_back(0);
                column_upper_bounds.push_back(1);
                number_of_columns++;
            }
        }

        // Constraints
        // will be increased each time we add a constraint
        int number_of_rows = 0;
        std::vector<CoinBigIndex> row_starts;
        std::vector<int> number_of_elements_in_rows;
        std::vector<int> element_columns;
        std::vector<double> elements;

        // An event can be scheduled at most once.
        for (EventId event_id = 0;
                event_id < instance.number_of_events();
                ++event_id) {
            // Initialize new row
            row_starts.push_back(elements.size());
            number_of_elements_in_rows.push_back(0);
            number_of_rows++;
            // Add row elements.
            for (Time time = 0;
                    time < instance.horizon();
                    ++time) {
                if (x[event_id][time] == -1)
                    continue;
                elements.push_back(1);
                element_columns.push_back(x[event_id][time]);
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
                row_starts.push_back(elements.size());
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
                        elements.push_back(1);
                        element_columns.push_back(x[event_id][t]);
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
            row_starts.push_back(elements.size());
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
                    elements.push_back(1);
                    element_columns.push_back(x[event_id][time]);
                    number_of_elements_in_rows.back()++;
                }
            }
            // Add row bounds
            row_lower_bounds.push_back(output.solution.number_of_events());
            row_upper_bounds.push_back(output.solution.number_of_events());
        }

        // Create matrix
        row_starts.push_back(elements.size());
        matrix = CoinPackedMatrix(
                false,
                number_of_columns,
                number_of_rows,
                elements.size(),
                elements.data(),
                element_columns.data(),
                row_starts.data(),
                number_of_elements_in_rows.data());

        OsiCbcSolverInterface solver;

        // Reduce printout.
        solver.getModelPtr()->setLogLevel(0);
        solver.messageHandler()->setLogLevel(0);

        // Load problem.
        solver.loadProblem(
                matrix,
                column_lower_bounds.data(),
                column_upper_bounds.data(),
                objective.data(),
                row_lower_bounds.data(),
                row_upper_bounds.data());

        // Set objective sense.
        if (objective_id == 0) {
            // Maximize (the number of events scheduled).
            solver.setObjSense(-1);
        } else if (objective_id == 1) {
            // Minimize (score).
            solver.setObjSense(1);
        }

        // Mark integer.
        for (int variable_id = 0;
                variable_id < number_of_columns;
                ++variable_id) {
            solver.setInteger(variable_id);
        }

        // Pass data and solver to CbcModel.
        CbcModel model(solver);

        // Reduce printout.
        model.setLogLevel(0);
        model.solver()->setHintParam(OsiDoReducePrint, true, OsiHintTry);

        // Set time limit.
        model.setMaximumSeconds(parameters.info.remaining_time());

        // Set the maximum number of nodes.
        if (parameters.maximum_number_of_nodes != -1)
            model.setMaximumNodes(parameters.maximum_number_of_nodes);

        // Add initial solution.
        if (objective_id != 0) {
            std::vector<double> sol_init(number_of_columns, 0);
            for (EventId event_id = 0;
                    event_id < instance.number_of_events();
                    ++event_id) {
                if (output.solution.event(event_id).start != -1)
                    sol_init[x[event_id][output.solution.event(event_id).start]] = 1;
            }
            model.setBestSolution(
                    sol_init.data(),
                    number_of_columns,
                    COIN_DBL_MAX,
                    true);
        }

        if (!parameters.mps_path.empty()) {
            std::string mps_path = parameters.mps_path + "_" + std::to_string(objective_id);
            solver.writeMps(mps_path.c_str());
        }

        // Do complete search.
        model.branchAndBound();

        if (model.isProvenInfeasible()) {
            // Infeasible.
            // Something's wrong.
            throw std::runtime_error("The model shouldn't be infeasible.");

        } else if (model.isProvenOptimal()
                || model.bestSolution() != NULL) {
            // Optimal or feasible solution found.
            // Retrieve solution.
            Solution solution(instance);
            const double* cbc_solution = model.solver()->getColSolution();
            for (EventId event_id = 0;
                    event_id < instance.number_of_events();
                    ++event_id) {
                const Event& event = instance.event(event_id);
                for (Time time = 0;
                        time < instance.horizon() - event.duration + 1;
                        ++time) {
                    if (x[event_id][time] == -1)
                        continue;
                    if (cbc_solution[x[event_id][time]] > 0.5) {
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

#endif

