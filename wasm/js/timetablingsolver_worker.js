// Web Worker solving timetabling instances with the WebAssembly module,
// without blocking the page.
//
// Messages to the worker:
// - {type: "solve", instance, parameters}: solve an instance (see 'toInstance'
//   in 'web/model.js'; 'parameters': see 'timetablingsolver_wasm.cpp').
//
// Messages from the worker:
// - {type: "ready"}: the module is loaded;
// - {type: "done", result}: the result of 'optimize';
// - {type: "error", error}: the optimization failed.
//
// The optimization can't be interrupted: to stop it, terminate the worker.
//
// In a browser, it is a classic worker: 'new Worker("timetablingsolver_worker.js")',
// next to 'timetablingsolver.js' and 'timetablingsolver.wasm'. In Node, it can
// be run with 'worker_threads', with the path of 'timetablingsolver.js' in
// 'workerData.modulePath'.

"use strict";

let postToPage;
let modulePromise;
if (typeof importScripts === "function") {
    // Browser.
    importScripts("timetablingsolver.js");
    postToPage = (message) => self.postMessage(message);
    self.onmessage = (event) => onMessage(event.data);
    modulePromise = TimetablingSolver();
} else {
    // Node.
    const {parentPort, workerData} = require("node:worker_threads");
    postToPage = (message) => parentPort.postMessage(message);
    parentPort.on("message", (message) => onMessage(message));
    modulePromise = require(workerData.modulePath)();
}

modulePromise.then(
    () => postToPage({type: "ready"}),
    (error) => postToPage({type: "error", error: "the module couldn't be loaded: " + error}));

async function onMessage(message) {
    if (message.type !== "solve")
        return;
    try {
        const module = await modulePromise;
        const result = solve(module, message.instance, message.parameters || {});
        postToPage({type: "done", result});
    } catch (error) {
        postToPage({type: "error", error: (error && error.message) || String(error)});
    }
}

function solve(module, instance, parameters) {
    const builder = new module.InstanceBuilder();
    try {
        builder.setHorizon(instance.horizon);
        builder.setDefaultScore(instance.defaultScore);
        for (const scores of instance.resources) {
            const resourceId = builder.addResource();
            for (const [time, score] of scores)
                builder.setScore(resourceId, time, score);
        }
        for (const event of instance.events) {
            const eventId = builder.addEvent(event.duration);
            for (const resourceId of event.resources)
                builder.addEventResource(eventId, resourceId);
        }
        return module.optimize(builder, parameters);
    } finally {
        builder.delete();
    }
}
