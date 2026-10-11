"""Development server of the TimetablingSolver web page.

Serves 'wasm/web/', the Web Worker ('wasm/js/timetablingsolver_worker.js') and
the WebAssembly module ('<build directory>/wasm/timetablingsolver.js' and
'.wasm'), at the same paths as the deployed site.

Usage:

    python3 wasm/web/serve.py [--port 8000] [--build-dir build_wasm]
"""

import argparse
import functools
import http.server
import os

WEB_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.join(WEB_DIR, "..", "..")


class Handler(http.server.SimpleHTTPRequestHandler):

    # Files served from outside 'wasm/web/'.
    extra_files = {}

    def translate_path(self, path):
        name = path.split("?", 1)[0].split("#", 1)[0].lstrip("/")
        if name in self.extra_files:
            return self.extra_files[name]
        return super().translate_path(path)

    def end_headers(self):
        # Always serve the latest version of the files.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--build-dir", default=os.path.join(ROOT_DIR, "build_wasm"))
    args = parser.parse_args()

    module_dir = os.path.join(args.build_dir, "wasm")
    Handler.extra_files = {
        "timetablingsolver_worker.js": os.path.join(ROOT_DIR, "wasm", "js", "timetablingsolver_worker.js"),
        "timetablingsolver.js": os.path.join(module_dir, "timetablingsolver.js"),
        "timetablingsolver.wasm": os.path.join(module_dir, "timetablingsolver.wasm"),
    }
    for path in Handler.extra_files.values():
        if not os.path.exists(path):
            print(f"Warning: {os.path.normpath(path)} not found: build the module first.")

    handler = functools.partial(Handler, directory=WEB_DIR)
    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Serving on http://localhost:{args.port}/")
        server.serve_forever()


if __name__ == "__main__":
    main()
