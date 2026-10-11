# TimetablingSolver in the browser

TimetablingSolver compiled to WebAssembly with [Emscripten](https://emscripten.org/), and a web page to build timetables in the browser. The computation runs on the user's machine.

## Build

```shell
emcmake cmake -S . -B build_wasm -DCMAKE_BUILD_TYPE=Release -DTIMETABLINGSOLVER_BUILD_WASM=ON
cmake --build build_wasm --target TimetablingSolver_wasm
```

This builds `build_wasm/wasm/timetablingsolver.js` and `timetablingsolver.wasm`.

The module is built without thread support: it doesn't need `SharedArrayBuffer`, so the page can be served without the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers.

## Contents

- `src/timetablingsolver_wasm.cpp`: the JavaScript API of the module: the class `InstanceBuilder`, which wraps the C++ `InstanceBuilder`, and `optimize(builder, parameters)`, which blocks. See the comment at the top of the file.
- `js/timetablingsolver_worker.js`: a Web Worker running the optimization and posting the result to the page.
- `web/`: the web page.
  - `model.js`: the projects (calendar, participants and their availabilities, courses), their conversion into instances of the solver and the conversion of the results into timetables.
  - `storage.js`: the storage of the projects in the browser (localStorage), their export and import.
  - `i18n.js`: the translations (English and French).
  - `app.js`: the page.
- `tests/`: the tests.

## Tests

```shell
node --test wasm/tests/*.test.js wasm/tests/*.test.mjs
```

## Web page

```shell
python3 wasm/web/serve.py
```

Then open http://localhost:8000/.

## Translations

The texts of the page are in `web/i18n.js`. To add a language, add it to `LANGUAGES` and `MESSAGES`, with every key of English: the tests check it.

## Deployment

The workflow `.github/workflows/wasm.yml` builds the module and the page and runs the tests. On every push to `main`, it also deploys the page to [Cloudflare Pages](https://pages.cloudflare.com/).

The deployment requires:
- a Cloudflare Pages project created for direct upload, named `timetablingsolver`, or set the repository variable `CLOUDFLARE_PAGES_PROJECT`;
- the repository secrets `CLOUDFLARE_API_TOKEN` (an API token with the "Cloudflare Pages: Edit" permission) and `CLOUDFLARE_ACCOUNT_ID`.
