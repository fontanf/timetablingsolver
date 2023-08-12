STDCPP = select({
            "@bazel_tools//src/conditions:windows": [''],
            "//conditions:default":                 ["-std=c++11"]})

CBC_COPTS = select({
            "//timetablingsolver:cbc_build": ["-DCBC_FOUND"],
            "//conditions:default": []})
CBC_DEP = select({
            "//timetablingsolver:cbc_build": ["@coinor//:cbc"],
            "//conditions:default": []})

