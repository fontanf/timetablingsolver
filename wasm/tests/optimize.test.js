// Run with: node --test wasm/tests/*.test.js
// The module path can be set with TIMETABLINGSOLVER_WASM (default:
// build_wasm/wasm/timetablingsolver.js).

const assert = require("node:assert");
const path = require("node:path");
const test = require("node:test");

const MODULE_PATH = process.env.TIMETABLINGSOLVER_WASM
    || path.join(__dirname, "..", "..", "build_wasm", "wasm", "timetablingsolver.js");

let modulePromise = null;
function loadModule() {
    if (modulePromise === null)
        modulePromise = require(MODULE_PATH)();
    return modulePromise;
}

const DEFAULT_SCORE = 10;

// Solve an instance given as:
//     {
//         horizon,
//         resources: [{[time]: score, ...}, ...],
//         events: [{duration, resources: [resourceId, ...]}, ...],
//     }
async function solve(instance, parameters = {}) {
    const module = await loadModule();
    const builder = new module.InstanceBuilder();
    try {
        builder.setHorizon(instance.horizon);
        builder.setDefaultScore(DEFAULT_SCORE);
        for (const scores of instance.resources) {
            const resourceId = builder.addResource();
            for (const [time, score] of Object.entries(scores))
                builder.setScore(resourceId, Number(time), score);
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

// Scores of the time steps [start, end).
function slots(start, end, score = 0) {
    const scores = {};
    for (let time = start; time < end; ++time)
        scores[time] = score;
    return scores;
}

// Check that no resource is in two events at the same time.
function assertNoOverlap(instance, result) {
    const busy = instance.resources.map(() => new Set());
    result.events.forEach((event, eventId) => {
        if (event.start === null)
            return;
        for (const resourceId of instance.events[eventId].resources) {
            for (let time = event.start; time < event.end; ++time) {
                assert.ok(
                    !busy[resourceId].has(time),
                    `resource ${resourceId} is in two events at time ${time}.`);
                busy[resourceId].add(time);
            }
        }
    });
}

test("individual course: scheduled on the preferred slots", async () => {
    // Teacher: 0-8; student: possible 2-4, preferred 4-6.
    const instance = {
        horizon: 8,
        resources: [slots(0, 8), {...slots(2, 4, 1), ...slots(4, 6, 0)}],
        events: [{duration: 2, resources: [0, 1]}],
    };
    const result = await solve(instance);
    assert.strictEqual(result.numberOfScheduledEvents, 1);
    assert.strictEqual(result.score, 0);
    assert.deepStrictEqual(result.events, [{
        start: 4,
        end: 6,
        resources: [
            {resource: 0, score: 0, available: true},
            {resource: 1, score: 0, available: true},
        ],
    }]);
});

test("individual and collective courses", async () => {
    // Teacher (0) and three students (1, 2, 3). The collective course needs
    // the three students: their only common slot is 6-8. Each student also
    // has an individual course.
    const instance = {
        horizon: 12,
        resources: [
            slots(0, 12),
            {...slots(0, 2), ...slots(6, 8)},
            {...slots(2, 4), ...slots(6, 8)},
            {...slots(4, 8)},
        ],
        events: [
            {duration: 2, resources: [0, 1, 2, 3]},
            {duration: 1, resources: [0, 1]},
            {duration: 1, resources: [0, 2]},
            {duration: 1, resources: [0, 3]},
        ],
    };
    const result = await solve(instance);
    assert.strictEqual(result.numberOfScheduledEvents, 4);
    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.events[0].start, 6);
    assert.strictEqual(result.events[0].resources.length, 4);
    for (const event of result.events)
        for (const resource of event.resources)
            assert.ok(resource.available);
    assertNoOverlap(instance, result);
});

test("unavailable slot used when there is no other way", async () => {
    // Both students are only available at 0-1, and the teacher at 0-2: one
    // of them is scheduled outside their availabilities.
    const instance = {
        horizon: 2,
        resources: [slots(0, 2), slots(0, 1), slots(0, 1)],
        events: [
            {duration: 1, resources: [0, 1]},
            {duration: 1, resources: [0, 2]},
        ],
    };
    const result = await solve(instance);
    assert.strictEqual(result.numberOfScheduledEvents, 2);
    assert.strictEqual(result.score, DEFAULT_SCORE);
    const unavailable = result.events.flatMap((event) =>
        event.resources.filter((resource) => !resource.available));
    assert.strictEqual(unavailable.length, 1);
    assert.strictEqual(unavailable[0].score, DEFAULT_SCORE);
    assertNoOverlap(instance, result);
});

test("events don't span unused time steps", async () => {
    // Two days of 3 time steps, separated by a time step used by no one.
    // The student is available at the end of day 1 and the start of day 2:
    // a course of 2 time steps can't be split across the days.
    const instance = {
        horizon: 7,
        resources: [{...slots(0, 3), ...slots(4, 7)}, {...slots(2, 3), ...slots(4, 5)}],
        events: [{duration: 2, resources: [0, 1]}],
    };
    const result = await solve(instance);
    assert.strictEqual(result.numberOfScheduledEvents, 1);
    const {start, end} = result.events[0];
    assert.ok(end <= 3 || start >= 4, `scheduled on ${start}-${end}.`);
});

test("event that doesn't fit: not scheduled", async () => {
    const instance = {
        horizon: 2,
        resources: [slots(0, 2), slots(0, 2)],
        events: [{duration: 3, resources: [0, 1]}],
    };
    const result = await solve(instance);
    assert.strictEqual(result.numberOfScheduledEvents, 0);
    assert.deepStrictEqual(result.events[0], {
        start: null,
        end: null,
        resources: [
            {resource: 0, score: null, available: true},
            {resource: 1, score: null, available: true},
        ],
    });
});

test("invalid inputs throw errors", async () => {
    const module = await loadModule();
    const builder = new module.InstanceBuilder();
    builder.setHorizon(4);
    const resourceId = builder.addResource();
    assert.throws(() => builder.setScore(resourceId + 1, 0, 0), /setScore: .*Invalid resource id/);
    assert.throws(() => builder.setScore(resourceId, 4, 0), /setScore: .*Invalid time/);
    assert.throws(() => builder.setScore(resourceId, 0, -1), /setScore: invalid score/);
    assert.throws(() => builder.addEvent(0), /addEvent: .*Invalid duration/);
    const eventId = builder.addEvent(1);
    assert.throws(() => builder.addEventResource(eventId + 1, resourceId), /addEventResource: .*Invalid event id/);
    assert.throws(() => builder.addEventResource(eventId, resourceId + 1), /addEventResource: .*Invalid resource id/);
    assert.throws(() => builder.setHorizon(-1), /setHorizon: invalid horizon/);
    builder.delete();
});

test("the builder can't be reused after 'optimize'", async () => {
    const module = await loadModule();
    const builder = new module.InstanceBuilder();
    builder.setHorizon(1);
    module.optimize(builder, {});
    assert.throws(() => builder.addResource(), /already used/);
    assert.throws(() => module.optimize(builder, {}), /already used/);
    builder.delete();
});
