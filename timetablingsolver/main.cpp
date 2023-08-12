#include "timetablingsolver/optimize.hpp"

#include <boost/program_options.hpp>

using namespace timetablingsolver;
namespace po = boost::program_options;

int main(int argc, char *argv[])
{

    // Parse program options
    std::string parameters_path;
    std::string events_path;
    std::string resources_path;
    std::string event_resources_path;
    std::string certificate_path;
    std::string output_path;
    std::string log_path;
    int verbosity_level = 0;
    int log_levelmax = 999;
    double time_limit = std::numeric_limits<double>::infinity();
    Seed seed = 0;

    po::options_description desc("Allowed options");
    desc.add_options()
        (",h", "Produce help message")

        ("parameters,", po::value<std::string>(&parameters_path)->required(), "parameters path")
        ("events,", po::value<std::string>(&events_path)->required(), "events path")
        ("resources,", po::value<std::string>(&resources_path)->required(), "resources path")
        ("event-resources,", po::value<std::string>(&event_resources_path)->required(), "event resources path")

        ("output,o", po::value<std::string>(&output_path), "output path")
        ("certificate,c", po::value<std::string>(&certificate_path), "certificate path")
        ("log,l", po::value<std::string>(&log_path), "log path")

        ("time-limit,t", po::value<double>(&time_limit), "time limit (s)")
        ("seed,s", po::value<Seed>(&seed), "seed")

        ("only-write-at-the-end,e", "only write output and certificate files at the end")
        ("verbosity-level,v", po::value<int>(&verbosity_level), "verbosity level")
        ("log2stderr,w", "write log in stderr")
        ;
    po::variables_map vm;
    po::store(po::parse_command_line(argc, argv, desc), vm);
    if (vm.count("help")) {
        std::cout << desc << std::endl;;
        return 1;
    }
    try {
        po::notify(vm);
    } catch (const po::required_option& e) {
        std::cout << desc << std::endl;;
        return 1;
    }

    Instance instance(
            events_path,
            resources_path,
            event_resources_path,
            parameters_path);

    optimizationtools::Info info = optimizationtools::Info()
        .set_verbosity_level(verbosity_level)
        .set_time_limit(time_limit)
        .set_certificate_path(certificate_path)
        .set_json_output_path(output_path)
        .set_only_write_at_the_end(vm.count("only-write-at-the-end"))
        .set_log_path(log_path)
        .set_log2stderr(vm.count("log2stderr"))
        .set_maximum_log_level(log_levelmax)
        .set_sigint_handler()
        ;

    OptimizeOptionalParameters parameters_opt;
    parameters_opt.info = info;
    optimize(instance, parameters_opt);

    return 0;
}

