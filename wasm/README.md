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
  - `availability_grid.js`: the grid where the availabilities are painted.
  - `polls.js`: the polls (see below).
  - `app.js`: the page of the teacher (`index.html`).
  - `poll_page.js`: the page of the students (`poll.html`).
- `server/api.js`: the API of the polls, run by Cloudflare Pages Functions (`functions/`).
- `tests/`: the tests.

## Tests

```shell
node --test wasm/tests/*.test.js wasm/tests/*.test.mjs
```

The tests need Node 20 or later (for the Web Crypto API), and the tests of the API of the polls need `node:sqlite` (Node 22.13 or later): they are skipped with older versions.

## Web page

```shell
python3 wasm/web/serve.py
```

Then open http://localhost:8000/. This server doesn't run the API of the polls: to try them, assemble the site as the workflow does (`pages/site`, `pages/functions`, `pages/server`) and run, in `pages/`:

```shell
npx wrangler pages dev site --d1 DB=local-polls
```

## Polls

The teacher creates a poll and sends its link to the students. Each student gives their name and their availabilities on `poll.html`, and can modify them with the same link until the poll is closed. The teacher fetches the responses into their project: a response replaces the availabilities of the student of the same name, or adds a new student with an individual course.

The definition of the poll (the week, the availabilities of the teacher, their message) and the responses are encrypted with AES-GCM in the browsers. The key is in the link, after `#`, which browsers don't send to servers: the server only stores encrypted data. It is a Cloudflare Pages Function with a D1 database (`server/api.js`); the polls expire a year after their last use.

## Translations

The texts of the page are in `web/i18n.js`. To add a language, add it to `LANGUAGES` and `MESSAGES`, with every key of English: the tests check it.

## Deployment

The workflow `.github/workflows/wasm.yml` builds the module and the page and runs the tests. On every push to `main`, it also deploys the page to [Cloudflare Pages](https://pages.cloudflare.com/).

The deployment requires:
- a Cloudflare Pages project created for direct upload, named `timetablingsolver`, or set the repository variable `CLOUDFLARE_PAGES_PROJECT`;
- the repository secrets `CLOUDFLARE_API_TOKEN` (an API token with the "Cloudflare Pages: Edit" permission) and `CLOUDFLARE_ACCOUNT_ID`;
- for the polls, a D1 database bound to the Pages project with the variable name `DB` (Settings > Bindings). The tables are created by the API.
