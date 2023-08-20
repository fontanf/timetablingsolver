load("@bazel_skylib//lib:selects.bzl", "selects")

config_setting(
        name = "cbc_build",
        values = {"define": "cbc=true"},
        visibility = ["//visibility:public"],
)

selects.config_setting_group(
    name = "cbc_linux",
    match_all = [":cbc_build", "@bazel_tools//src/conditions:linux"],
)

selects.config_setting_group(
    name = "cbc_darwin",
    match_all = [":cbc_build", "@bazel_tools//src/conditions:darwin"],
)

selects.config_setting_group(
    name = "cbc_windows",
    match_all = [":cbc_build", "@bazel_tools//src/conditions:windows"],
)

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

