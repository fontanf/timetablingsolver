# TimetablingSolver in the browser

TimetablingSolver compiled to WebAssembly with [Emscripten](https://emscripten.org/). The computation runs on the user's machine.

## Build

```shell
emcmake cmake -S . -B build_wasm -DCMAKE_BUILD_TYPE=Release -DTIMETABLINGSOLVER_BUILD_WASM=ON
cmake --build build_wasm --target TimetablingSolver_wasm
```

This builds `build_wasm/wasm/timetablingsolver.js` and `timetablingsolver.wasm`.

The module is built without thread support: it doesn't need `SharedArrayBuffer`, so the page can be served without the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers.

## Contents

- `src/timetablingsolver_wasm.cpp`: the JavaScript API of the module: the class `InstanceBuilder`, which wraps the C++ `InstanceBuilder`, and `optimize(builder, parameters)`, which blocks. See the comment at the top of the file.
- `tests/`: the tests.

## Tests

```shell
node --test wasm/tests/*.test.js
```
