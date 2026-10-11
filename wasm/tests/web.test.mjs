// Run with: node --test wasm/tests/*.test.js wasm/tests/*.test.mjs
// The scripts of the web page: translations ('i18n.js'), model ('model.js'),
// storage ('storage.js'), and a project solved with the Web Worker.

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {Worker} from "node:worker_threads";

import * as i18n from "../web/i18n.js";
import * as model from "../web/model.js";
import * as storage from "../web/storage.js";

const DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.join(DIRECTORY, "..", "web");
const WORKER_PATH = path.join(DIRECTORY, "..", "js", "timetablingsolver_worker.js");
const MODULE_PATH = process.env.TIMETABLINGSOLVER_WASM
    || path.join(DIRECTORY, "..", "..", "build_wasm", "wasm", "timetablingsolver.js");

// Solve an instance with the Web Worker of the page.
function solveWithWorker(instance, parameters = {}) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(WORKER_PATH, {workerData: {modulePath: MODULE_PATH}});
        worker.on("message", (message) => {
            if (message.type === "ready")
                return;
            worker.terminate();
            if (message.type === "done")
                resolve(message.result);
            else
                reject(new Error(message.error));
        });
        worker.on("error", reject);
        worker.postMessage({type: "solve", instance, parameters});
    });
}

function withLanguage(language, f) {
    const previous = i18n.getLanguage();
    i18n.setLanguage(language);
    try {
        return f();
    } finally {
        i18n.setLanguage(previous);
    }
}

// 'app.js' needs a browser: at least check the syntax of all the scripts.
test("scripts of the page: syntax", () => {
    for (const file of fs.readdirSync(WEB_DIR).filter((f) => f.endsWith(".js")))
        execFileSync(process.execPath, ["--check", path.join(WEB_DIR, file)]);
    execFileSync(process.execPath, ["--check", WORKER_PATH]);
});

/////////////////////////////////////////////////////////////////////////////
// Translations
/////////////////////////////////////////////////////////////////////////////

const placeholders = (message) => [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("i18n: every language has the keys and placeholders of English", () => {
    const english = i18n.MESSAGES[i18n.DEFAULT_LANGUAGE];
    for (const language of Object.keys(i18n.LANGUAGES)) {
        const messages = i18n.MESSAGES[language];
        assert.deepStrictEqual(Object.keys(messages).sort(), Object.keys(english).sort(), language);
        for (const [key, message] of Object.entries(english))
            assert.deepStrictEqual(placeholders(messages[key]), placeholders(message), `${language}: ${key}`);
    }
});

test("i18n: the keys used by the page exist", () => {
    const english = i18n.MESSAGES[i18n.DEFAULT_LANGUAGE];
    const html = fs.readFileSync(path.join(WEB_DIR, "index.html"), "utf8");
    const keys = [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map((m) => m[1]);
    for (const file of ["app.js", "model.js", "storage.js"]) {
        const script = fs.readFileSync(path.join(WEB_DIR, file), "utf8");
        keys.push(...[...script.matchAll(/\bt\("([^"]+)"/g)].map((m) => m[1]));
        // Keys chosen with a conditional: 't(cond? "a": "b")'.
        keys.push(...[...script.matchAll(/"((?:role|availability)\.[a-zA-Z]+)"/g)].map((m) => m[1]));
    }
    assert.ok(keys.length > 50);
    for (const key of keys)
        assert.ok(key in english, `missing key: ${key}`);
});

test("i18n: language detection", () => {
    assert.strictEqual(i18n.detectLanguage("fr", ["en-US"]), "fr");
    assert.strictEqual(i18n.detectLanguage(null, ["de-DE", "fr-CA", "en"]), "fr");
    assert.strictEqual(i18n.detectLanguage("xx", ["de"]), "en");
    assert.strictEqual(i18n.detectLanguage(null, []), "en");
});

test("i18n: messages and day names", () => {
    withLanguage("fr", () => {
        assert.strictEqual(i18n.t("check.noAvailability", {name: "Alice"}), "Alice n'a indiqué aucune disponibilité.");
        assert.strictEqual(i18n.dayName(0), "Lundi");
        assert.strictEqual(i18n.dayName(6), "Dimanche");
    });
    withLanguage("en", () => {
        assert.strictEqual(i18n.t("names.individualCourse", {name: "Alice"}), "Alice's course");
        assert.strictEqual(i18n.dayName(2), "Wednesday");
    });
});

/////////////////////////////////////////////////////////////////////////////
// Model
/////////////////////////////////////////////////////////////////////////////

test("model: times", () => {
    assert.strictEqual(model.formatTime(9 * 60 + 5), "09:05");
    assert.strictEqual(model.parseTime("9:30"), 570);
    assert.ok(Number.isNaN(model.parseTime("25:00")));
    assert.ok(Number.isNaN(model.parseTime("abc")));
    const calendar = model.defaultCalendar();
    calendar.step = 20;
    calendar.days[0].ranges = [{start: 600, end: 660}];
    calendar.days[1].ranges = [{start: 840, end: 900}, {start: 600, end: 650}];
    assert.deepStrictEqual(model.slotTimes(calendar, 0), [600, 620, 640]);
    assert.deepStrictEqual(model.slotTimes(calendar, 1), [600, 620, 840, 860, 880]);
});

test("model: instance of a project", () => {
    const project = model.newProject("Test");
    // Monday 10:00-11:00 and Wednesday 10:15-11:00.
    project.calendar.step = 15;
    project.calendar.days.forEach((d, day) => {
        d.ranges = (day === 0 || day === 2)? [{start: day === 2? 615: 600, end: 660}]: [];
    });
    const teacher = model.teacherOf(project);
    const student = model.addStudent(project, "Alice", 20);
    model.setAvailability(teacher, 0, 600, 660, 0, 15);
    model.setAvailability(student, 2, 615, 645, 1, 15);
    // Outside the calendar: ignored.
    model.setAvailability(student, 1, 600, 660, 0, 15);
    model.setAvailability(student, 2, 660, 720, 0, 15);

    const instance = model.toInstance(project);
    // Days of 4 and 3 slots, each followed by an unused time step.
    assert.strictEqual(instance.horizon, 9);
    assert.strictEqual(instance.defaultScore, 10);
    assert.deepStrictEqual(instance.resources, [
        [[0, 0], [1, 0], [2, 0], [3, 0]],
        [[5, 1], [6, 1]],
    ]);
    // 20 minutes: 2 slots of 15 minutes.
    assert.deepStrictEqual(instance.events, [{duration: 2, resources: [0, 1]}]);

    const {errors, warnings} = withLanguage("en", () => model.check(project));
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(warnings, [
        "The duration of the course “Alice's course” (20 min) isn't a multiple of the step (15 min): it is rounded up to 30 min."]);
});

test("model: errors", () => {
    const project = model.newProject("Test");
    project.calendar.days.forEach((d) => d.ranges = []);
    assert.deepStrictEqual(withLanguage("en", () => model.check(project)).errors, [
        "There is no time range in the week.",
        "There is no course to schedule.",
    ]);
    project.calendar.days[3].ranges = [{start: 600, end: 610}];
    // Can't be added with 'addRange', but can be imported.
    project.calendar.days[4].ranges = [{start: 600, end: 720}, {start: 540, end: 660}];
    assert.deepStrictEqual(withLanguage("en", () => model.check(project)).errors, [
        "Thursday: the time range 10:00–10:10 is shorter than the step.",
        "Friday: the time ranges 09:00–11:00 and 10:00–12:00 overlap.",
        "There is no course to schedule.",
    ]);
});

test("model: adding and removing time ranges", () => {
    const calendar = model.defaultCalendar();
    calendar.days.forEach((d) => d.ranges = []);
    // Monday to Friday, then Wednesday morning.
    assert.strictEqual(model.addRange(calendar, [0, 1, 2, 3, 4], 840, 1080), null);
    assert.strictEqual(model.addRange(calendar, [2], 540, 720), null);
    assert.deepStrictEqual(model.usedDays(calendar), [0, 1, 2, 3, 4]);
    // Sorted by start.
    assert.deepStrictEqual(calendar.days[2].ranges, [{start: 540, end: 720}, {start: 840, end: 1080}]);
    // Overlapping ranges aren't allowed, and then no day gets the range.
    const error = model.addRange(calendar, [5, 2], 700, 900);
    assert.strictEqual(error.key, "calendar.overlappingRange");
    assert.strictEqual(withLanguage("en", () => i18n.t(error.key, error.parameters)),
        "Wednesday: the range overlaps 09:00–12:00.");
    assert.deepStrictEqual(calendar.days[5].ranges, []);
    assert.strictEqual(model.addRange(calendar, [6], 600, 600).key, "calendar.invalidRange");
    // Touching ranges are merged.
    assert.strictEqual(model.addRange(calendar, [2], 720, 780), null);
    assert.deepStrictEqual(calendar.days[2].ranges.map(model.formatRange), ["09:00–13:00", "14:00–18:00"]);
    assert.strictEqual(model.addRange(calendar, [2], 780, 840), null);
    assert.deepStrictEqual(calendar.days[2].ranges.map(model.formatRange), ["09:00–18:00"]);
    // Removing.
    model.removeRange(calendar, 1, calendar.days[1].ranges[0]);
    assert.deepStrictEqual(model.usedDays(calendar), [0, 2, 3, 4]);
});

test("model: removing a participant removes them from the courses", () => {
    const project = model.newProject("Test");
    const [alice, bruno] = withLanguage("en", () =>
        [model.addStudent(project, "Alice"), model.addStudent(project, "Bruno")]);
    const teacherId = model.teacherOf(project).id;
    project.courses.push(model.newCourse("Group", 60, [teacherId, alice.id, bruno.id]));
    project.courses.push(model.newCourse("Teacher only", 60, [teacherId]));
    model.removeParticipant(project, alice.id);
    assert.deepStrictEqual(project.courses.map((c) => c.name), ["Bruno's course", "Group", "Teacher only"]);
    assert.deepStrictEqual(project.courses[1].participants, [teacherId, bruno.id]);
    // Their individual course and the group course have no student left.
    model.removeParticipant(project, bruno.id);
    assert.deepStrictEqual(project.courses.map((c) => c.name), ["Teacher only"]);
});

test("model: time ranges of a day", async () => {
    // Monday 10:00-11:00 and 14:00-15:00. The teacher and the student are
    // available all day, but a course of 2 hours can't span the break; a
    // course of 1 hour fits in each range.
    const project = model.newProject("Test");
    project.calendar.step = 30;
    project.calendar.days.forEach((d, day) => {
        d.ranges = day === 0? [{start: 600, end: 660}, {start: 840, end: 900}]: [];
    });
    const alice = model.addStudent(project, "Alice", 60);
    for (const participant of project.participants)
        model.setAvailability(participant, 0, 0, 24 * 60, 0, 30);
    project.courses.push(model.newCourse("Long", 120, [model.teacherOf(project).id, alice.id]));
    const instance = model.toInstance(project);
    // 2 slots, an unused time step, 2 slots, an unused time step.
    assert.strictEqual(instance.horizon, 6);
    assert.deepStrictEqual(instance.resources[0], [[0, 0], [1, 0], [3, 0], [4, 0]]);
    const timetable = model.toTimetable(project, await solveWithWorker(instance));
    const [individual, long] = timetable.courses;
    assert.strictEqual(long.day, null);
    assert.ok([600, 840].includes(individual.start), `scheduled at ${individual.start}.`);
    assert.strictEqual(individual.end, individual.start + 60);
});

test("model: timetable of a result", () => {
    // The names of the new teacher and courses are in the language of the page.
    const project = withLanguage("fr", () => model.newProject("Test"));
    // Tuesday 10:00-11:00 and Thursday 10:15-11:00.
    project.calendar.step = 15;
    project.calendar.days.forEach((d, day) => {
        d.ranges = (day === 1 || day === 3)? [{start: day === 3? 615: 600, end: 660}]: [];
    });
    const alice = withLanguage("fr", () => model.addStudent(project, "Alice", 30));
    const result = {
        score: 10,
        time: 0.1,
        events: [{
            start: 6,
            end: 8,
            resources: [
                {resource: 0, score: 0, available: true},
                {resource: 1, score: 10, available: false},
            ],
        }],
    };
    const timetable = model.toTimetable(project, result);
    assert.strictEqual(timetable.signature, model.signature(project));
    assert.deepStrictEqual(timetable.courses, [{
        courseId: project.courses[0].id,
        // Time 6: second day (Thursday, starting at time 5), second slot.
        day: 3,
        start: 630,
        end: 660,
        participants: [
            {participantId: model.teacherOf(project).id, score: 0, available: true},
            {participantId: alice.id, score: 10, available: false},
        ],
    }]);

    const csv = withLanguage("fr", () => model.timetableCsv(project, timetable));
    assert.strictEqual(csv,
        "Cours;Jour;Début;Fin;Participants;Hors disponibilités\n"
        + "Cours de Alice;Jeudi;10:30;11:00;Professeur, Alice;Alice\n");

    project.courses[0].duration = 45;
    assert.notStrictEqual(timetable.signature, model.signature(project));
});

test("model: example project solved by the worker", async () => {
    const project = withLanguage("fr", () => model.exampleProject());
    assert.deepStrictEqual(model.check(project).errors, []);
    const result = await solveWithWorker(model.toInstance(project), {timeLimit: 10});
    const timetable = model.toTimetable(project, result);
    // Every course is scheduled, in the availabilities of everyone.
    assert.strictEqual(result.numberOfScheduledEvents, project.courses.length);
    for (const course of timetable.courses) {
        assert.notStrictEqual(course.day, null);
        for (const participant of course.participants)
            assert.ok(participant.available);
    }
    // The collective course is on Wednesday 18:00-19:00, the only slot where
    // its students are all available.
    const collective = timetable.courses[timetable.courses.length - 1];
    assert.deepStrictEqual([collective.day, collective.start, collective.end], [2, 18 * 60, 19 * 60]);
    // No one is in two courses at the same time.
    const busy = new Set();
    for (const course of timetable.courses) {
        for (const participant of course.participants) {
            for (let minute = course.start; minute < course.end; minute += project.calendar.step) {
                const key = `${participant.participantId} ${course.day} ${minute}`;
                assert.ok(!busy.has(key), key);
                busy.add(key);
            }
        }
    }
});

test("worker: errors are reported", async () => {
    await assert.rejects(
        solveWithWorker({horizon: 1, defaultScore: 10, resources: [], events: [{duration: 0, resources: []}]}),
        /addEvent: .*Invalid duration/);
});

/////////////////////////////////////////////////////////////////////////////
// Storage
/////////////////////////////////////////////////////////////////////////////

class FakeStorage {
    constructor() {
        this.items = new Map();
    }

    getItem(key) {
        return this.items.has(key)? this.items.get(key): null;
    }

    setItem(key, value) {
        this.items.set(key, String(value));
    }
}

test("storage: projects saved and loaded", () => {
    const store = new storage.LocalStorageStore(new FakeStorage());
    assert.deepStrictEqual(store.load(), []);
    const projects = [model.exampleProject(), model.newProject("Other")];
    store.save(projects);
    assert.deepStrictEqual(store.load(), projects);
});

test("storage: export and import", () => {
    const project = model.exampleProject();
    const imported = storage.importProject(storage.exportProject(project));
    assert.notStrictEqual(imported.id, project.id);
    assert.deepStrictEqual({...imported, id: project.id, created: project.created}, project);
});

test("storage: invalid imports", () => {
    withLanguage("en", () => {
        assert.throws(() => storage.importProject("{"), /isn't a valid JSON file/);
        assert.throws(() => storage.importProject("{\"format\": \"other\"}"), /isn't a project exported/);
        assert.throws(
            () => storage.importProject(JSON.stringify({format: storage.EXPORT_FORMAT, version: 99, project: {}})),
            /newer version/);
    });
});

test("storage: missing fields get their defaults", () => {
    const project = storage.normalizeProject({name: "Old", participants: [{id: 1, name: "A"}]});
    assert.strictEqual(project.name, "Old");
    assert.deepStrictEqual(project.calendar, model.defaultCalendar());
    assert.deepStrictEqual(project.participants, [{id: "1", name: "A", role: "student", availability: {}}]);
    assert.deepStrictEqual(project.courses, []);
    assert.deepStrictEqual(project.parameters, model.defaultParameters());
    assert.strictEqual(project.result, null);
});

test("storage: calendars of the first versions are converted", () => {
    const calendar = storage.normalizeProject({calendar: {days: [0, 2], start: 600, end: 1080, step: 30}}).calendar;
    assert.strictEqual(calendar.step, 30);
    assert.deepStrictEqual(calendar.days.map((d) => d.ranges), [
        [{start: 600, end: 1080}], [], [{start: 600, end: 1080}], [], [], [], []]);
    // Development versions: a flag 'enabled', a single range per day.
    const single = storage.normalizeProject({calendar: {step: 15, days: [
        {enabled: true, start: 600, end: 700},
        {enabled: false, ranges: [{start: 600, end: 700}]},
        {enabled: true, ranges: [{start: 800, end: 900}, {start: 600, end: 700}]},
    ]}}).calendar;
    assert.deepStrictEqual(single.days.slice(0, 3).map((d) => d.ranges), [
        [{start: 600, end: 700}], [], [{start: 600, end: 700}, {start: 800, end: 900}]]);
    // Invalid values: the default step, the invalid ranges are dropped.
    const invalid = storage.normalizeProject({calendar: {step: 7, days: [
        {ranges: [{start: -5, end: "x"}, {start: 700, end: 600}, {start: 600, end: 660}]}]}}).calendar;
    assert.strictEqual(invalid.step, model.defaultCalendar().step);
    assert.deepStrictEqual(invalid.days[0], {ranges: [{start: 600, end: 660}]});
});

test("storage: unique names", () => {
    assert.strictEqual(storage.uniqueName("A", ["B"]), "A");
    assert.strictEqual(storage.uniqueName("A", ["A", "A (2)"]), "A (3)");
});
