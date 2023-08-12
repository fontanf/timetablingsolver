def Settings(**kwargs):
    return {
            'flags': [
                '-x', 'c++',
                '-Wall', '-Wextra', '-Werror',
                '-I', '.',

                '-I', './bazel-timetablingsolver/external/'
                'json/single_include/',

                '-I', './bazel-timetablingsolver/external/'
                'googletest/googletest/include/',

                '-I', './bazel-timetablingsolver/external/'
                'boost/',

                # optimizationtools
                '-I', './bazel-timetablingsolver/external/'
                # '-I', './../'
                'optimizationtools/',

                # COIN-OR
                '-DCBC_FOUND',
                '-I', '/home/florian/Programmes/coinbrew/dist/include/coin/',

                ],
            }
