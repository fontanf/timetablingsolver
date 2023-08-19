load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

git_repository(
    name = "googletest",
    remote = "https://github.com/google/googletest.git",
    commit = "58d77fa8070e8cec2dc1ed015d66b454c8d78850",
    shallow_since = "1656350095 -0400",
)

git_repository(
    name = "com_github_nelhage_rules_boost",
    remote = "https://github.com/nelhage/rules_boost",
    commit = "e83dfef18d91a3e35c8eac9b9aeb1444473c0efd",
    shallow_since = "1671181466 +0000",
)
load("@com_github_nelhage_rules_boost//:boost/boost.bzl", "boost_deps")
boost_deps()

http_archive(
    name = "json",
    build_file_content = """
cc_library(
        name = "json",
        hdrs = ["single_include/nlohmann/json.hpp"],
        visibility = ["//visibility:public"],
        strip_include_prefix = "single_include/"
)
""",
    urls = ["https://github.com/nlohmann/json/releases/download/v3.7.3/include.zip"],
    sha256 = "87b5884741427220d3a33df1363ae0e8b898099fbc59f1c451113f6732891014",
)

git_repository(
    name = "optimizationtools",
    remote = "https://github.com/fontanf/optimizationtools.git",
    commit = "ab54558ca28f5095ddc5360779d9d75b2553483f",
)

local_repository(
    name = "optimizationtools_",
    path = "../optimizationtools/",
)

new_local_repository(
    name = "coinor",
    path = "/home/florian/Programmes/coinbrew/dist/",
    # https://github.com/coin-or/Cbc/releases
    #path = ".../Cbc-releases.2.10.10-w64-msvc16-md/",
    build_file_content = """
cc_library(
    name = "osi",
    hdrs = glob(["include/coin/Osi*.h*"], exclude_directories = 0),
    strip_include_prefix = "include/coin/",
    visibility = ["//visibility:public"],
    srcs = select({
            "@bazel_tools//src/conditions:windows": [
                "lib/libOsi.lib",
                "lib/libOsiCommonTests.lib"],
            "//conditions:default": []}),
    copts = select({
            "@bazel_tools//src/conditions:windows": ["/MT"],
            "//conditions:default": []}),
)
cc_library(
    name = "coinutils",
    hdrs = glob(["include/coin/Coin*.h*"], exclude_directories = 0),
    strip_include_prefix = "include/coin/",
    srcs = select({
            "@bazel_tools//src/conditions:windows": [
                "lib/libCoinUtils.lib"],
            "//conditions:default": [
                "lib/libCoinUtils.so"]}),
    visibility = ["//visibility:public"],
)
cc_library(
    name = "clp",
    hdrs = glob(["include/coin/Clp*.h*"], exclude_directories = 0),
    strip_include_prefix = "include/coin",
    srcs = select({
            "@bazel_tools//src/conditions:windows": [
                "lib/libClp.lib",
                "lib/libOsiClp.lib"],
            "//conditions:default": [
                "lib/libClp.so"]}),
    deps = [":coinutils", ":osi"],
    visibility = ["//visibility:public"],
)
cc_library(
    name = "cbc",
    hdrs = glob(["include/coin/Cbc*.h*"], exclude_directories = 0),
    strip_include_prefix = "include/coin",
    srcs = select({
            "@bazel_tools//src/conditions:windows": [
                "lib/libCbc.lib",
                "lib/libOsiCbc.lib",
                "lib/libCgl.lib"],
            "//conditions:default": [
                "lib/libCbc.so",
                "lib/libOsiCbc.so"]}),
    deps = [":coinutils", ":osi", ":clp"],
    visibility = ["//visibility:public"],
)
""",
)
