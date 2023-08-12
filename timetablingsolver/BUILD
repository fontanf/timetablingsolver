config_setting(name = "cbc_build", values = {"define": "cbc=true"}, visibility = ["//visibility:public"])

load("//timetablingsolver:variables.bzl", "STDCPP",
         "CBC_COPTS", "CBC_DEP")

cc_library(
        name = "timetablingsolver",
        hdrs = [
                "instance.hpp",
                "solution.hpp",
                "optimize.hpp",
                "milp.hpp",
        ],
        srcs = [
                "instance.cpp",
                "solution.cpp",
                "optimize.cpp",
                "milp.cpp",
        ],
        deps = [
                "@optimizationtools//optimizationtools/utils:info",
                "@optimizationtools//optimizationtools/utils:utils",
        ] + CBC_DEP,
        copts = STDCPP + CBC_COPTS,
        visibility = ["//visibility:public"],
)

cc_binary(
        name = "main",
        srcs = ["main.cpp"],
        deps = [
                ":timetablingsolver",
                "@boost//:program_options",
        ],
        copts = STDCPP,
        linkopts = select({
                "@bazel_tools//src/conditions:windows": [],
                "//conditions:default":                 ["-lpthread"],
        }),
)

