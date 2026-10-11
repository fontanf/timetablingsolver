// Run with: node --test wasm/tests/*.test.js wasm/tests/*.test.mjs
// The polls ('web/polls.js'): encryption, links, import of the responses, and
// a poll from its creation to the import of the responses, with the API of
// the server ('server/api.js').

import assert from "node:assert";
import test from "node:test";

import {handleApi} from "../server/api.js";
import * as model from "../web/model.js";
import * as polls from "../web/polls.js";
import {FakeD1, hasSqlite} from "./fake_d1.mjs";

test("polls: encryption", async () => {
    const key = polls.generateKey();
    assert.match(key, /^[A-Za-z0-9_-]{43}$/);
    const value = {name: "Chloé", availability: {"0:540": 0}};
    const encrypted = await polls.encrypt(key, value);
    assert.ok(!encrypted.includes("Chlo"));
    assert.deepStrictEqual(await polls.decrypt(key, encrypted), value);
    // A different initialization vector each time.
    assert.notStrictEqual(await polls.encrypt(key, value), encrypted);
    // Wrong key, modified data.
    await assert.rejects(polls.decrypt(polls.generateKey(), encrypted));
    const modified = encrypted.slice(0, 20) + (encrypted[20] === "A"? "B": "A") + encrypted.slice(21);
    await assert.rejects(polls.decrypt(key, modified));
});

test("polls: links", () => {
    const pollId = polls.randomToken();
    const key = polls.generateKey();
    const link = polls.pollLink("https://example.org/app/index.html?x=1#y", pollId, key);
    assert.strictEqual(link, `https://example.org/app/poll.html#p=${pollId}&k=${key}`);
    assert.deepStrictEqual(polls.parsePollLink(new URL(link).hash), {pollId, key});
    assert.strictEqual(polls.parsePollLink(""), null);
    // Truncated key.
    assert.strictEqual(polls.parsePollLink(`#p=${pollId}&k=${key.slice(0, 20)}`), null);
});

test("polls: personal links", () => {
    const pollId = polls.randomToken();
    const key = polls.generateKey();
    const personal = {responseId: polls.randomToken(), token: polls.randomToken()};
    const link = polls.personalLink("https://example.org/", pollId, key, personal, "Chloé & co");
    assert.deepStrictEqual(polls.parsePollLink(new URL(link).hash), {pollId, key, ...personal, name: "Chloé & co"});
    // Without the token: invalid.
    assert.strictEqual(polls.parsePollLink(new URL(link).hash.replace(/&t=[^&]*/, "")), null);
});

test("polls: personal links of the students of a project", () => {
    const project = model.newProject("Test");
    const alice = model.addStudent(project, "Alice");
    project.poll = {id: polls.randomToken(), key: polls.generateKey()};
    assert.ok(polls.ensurePersonalLinks(project));
    assert.ok(!polls.ensurePersonalLinks(project));
    // Not for the teacher.
    assert.strictEqual(model.teacherOf(project).pollLink, undefined);
    assert.strictEqual(alice.pollLink.pollId, project.poll.id);
    const link = polls.participantLink("https://example.org/", project, alice);
    assert.deepStrictEqual(polls.parsePollLink(new URL(link).hash),
        {pollId: project.poll.id, key: project.poll.key, responseId: alice.pollLink.responseId,
            token: alice.pollLink.token, name: "Alice"});
    // A student added later gets a link too.
    const bruno = model.addStudent(project, "Bruno");
    assert.strictEqual(polls.participantLink("https://example.org/", project, bruno), null);
    assert.ok(polls.ensurePersonalLinks(project));
    assert.notStrictEqual(polls.participantLink("https://example.org/", project, bruno), null);
    // A link of another poll isn't valid.
    project.poll = {id: polls.randomToken(), key: polls.generateKey()};
    assert.strictEqual(polls.participantLink("https://example.org/", project, alice), null);
});

test("polls: import of the responses of personal links", () => {
    const project = model.newProject("Test");
    const alice = model.addStudent(project, "Alice");
    const bruno = model.addStudent(project, "Bruno");
    project.poll = {id: polls.randomToken(), key: polls.generateKey()};
    polls.ensurePersonalLinks(project);
    const response = (id, name, updated, availability) => ({id, name, updated, availability, comment: ""});

    // Alice answers with her personal link, whatever the name in it; Bruno
    // first answered with the shared link, then with his personal link.
    const summary = polls.importResponses(project, [
        response(bruno.pollLink.responseId, "Bruno", 20, {"1:600": 1}),
        response(alice.pollLink.responseId, "Alicia", 10, {"0:600": 0}),
        response("shared", "bruno", 5, {"2:600": 0}),
    ]);
    assert.deepStrictEqual({...summary, updated: summary.updated.sort()},
        {added: [], updated: ["Alice", "Bruno"], unchanged: 0});
    assert.deepStrictEqual(alice.availability, {"0:600": 0});
    assert.strictEqual(alice.name, "Alice");
    // The latest response of Bruno.
    assert.deepStrictEqual(bruno.availability, {"1:600": 1});
    assert.deepStrictEqual(bruno.pollResponseIds, ["shared", bruno.pollLink.responseId]);
    assert.strictEqual(bruno.pollUpdated, 20);
    // A new student of the shared link gets a personal link.
    polls.importResponses(project, [response("new", "Chloé", 30, {"3:600": 0})]);
    assert.strictEqual(project.participants.at(-1).pollLink.pollId, project.poll.id);
});

test("polls: responses are checked", () => {
    assert.deepStrictEqual(polls.normalizeResponse({
        name: "  Alice ",
        availability: {"0:540": 0, "1:600": 1, "7:600": 0, "0:555": 2, "x": 0},
        comment: 3,
    }), {name: "Alice", availability: {"0:540": 0, "1:600": 1}, comment: ""});
    assert.throws(() => polls.normalizeResponse({availability: {}}));
    assert.throws(() => polls.normalizeResponse(null));
});

test("polls: import of the responses", () => {
    const project = model.newProject("Test");
    const alice = model.addStudent(project, "Alice");
    alice.availability = {"0:540": 0};
    const response = (id, name, updated, availability = {"1:600": 0}) =>
        ({id, name, updated, availability, comment: ""});

    // Alice by her name (whatever the case and the spaces), Bruno is new.
    let summary = polls.importResponses(project, [
        response("r1", " alice  ", 10),
        response("r2", "Bruno", 10, {"2:600": 1}),
    ]);
    assert.deepStrictEqual(summary, {added: ["Bruno"], updated: ["Alice"], unchanged: 0});
    assert.deepStrictEqual(alice.availability, {"1:600": 0});
    const bruno = project.participants.find((p) => p.name === "Bruno");
    assert.deepStrictEqual(bruno.availability, {"2:600": 1});
    // Bruno has an individual course with the teacher.
    assert.deepStrictEqual(project.courses.at(-1).participants, [model.teacherOf(project).id, bruno.id]);

    // The teacher modifies Alice's availabilities: kept while her response
    // doesn't change.
    alice.availability["3:600"] = 0;
    summary = polls.importResponses(project, [response("r1", "Alice", 10), response("r2", "Bruno", 10)]);
    assert.deepStrictEqual(summary, {added: [], updated: [], unchanged: 2});
    assert.strictEqual(alice.availability["3:600"], 0);

    // Alice modifies her response, and her name: it is still hers.
    summary = polls.importResponses(project, [response("r1", "Alice B.", 20, {"4:600": 1})]);
    assert.deepStrictEqual(summary, {added: [], updated: ["Alice"], unchanged: 0});
    assert.deepStrictEqual(alice.availability, {"4:600": 1});

    // Another "Alice": a new student (Alice already has her response).
    summary = polls.importResponses(project, [response("r3", "Alice", 30)]);
    assert.deepStrictEqual(summary.added, ["Alice"]);
    // Responses without name are ignored.
    assert.deepStrictEqual(polls.importResponses(project, [response("r4", "", 30)]),
        {added: [], updated: [], unchanged: 0});
});

// The API of the server, called without network.
function localApi() {
    const env = {DB: new FakeD1()};
    return new polls.PollApi("https://example.org", (url, init) => handleApi(new Request(url, init), env));
}

test("polls: from the creation to the import of the responses", {
    skip: hasSqlite? false: "node:sqlite isn't available",
}, async () => {
    const api = localApi();
    const project = model.newProject("Piano");
    const teacher = model.teacherOf(project);
    teacher.name = "Mme Martin";
    teacher.availability = {"0:540": 0};

    // The teacher creates the poll.
    await polls.createPoll(api, project, "Hello!");
    const {poll} = project;
    assert.ok(!polls.isPollOutdated(project));

    // A student opens the link.
    const opened = await polls.openPoll(api, poll.id, poll.key);
    assert.strictEqual(opened.closed, false);
    assert.strictEqual(opened.definition.title, "Piano");
    assert.strictEqual(opened.definition.teacher, "Mme Martin");
    assert.strictEqual(opened.definition.message, "Hello!");
    assert.deepStrictEqual(opened.definition.calendar, project.calendar);
    assert.deepStrictEqual(opened.definition.teacherAvailability, {"0:540": 0});
    // With a wrong key, the definition can't be decrypted.
    await assert.rejects(polls.openPoll(api, poll.id, polls.generateKey()));

    // A student of the project answers with their personal link, from two
    // devices.
    const lea = model.addStudent(project, "Léa");
    polls.ensurePersonalLinks(project);
    const leaLink = polls.parsePollLink(new URL(polls.participantLink("https://example.org/", project, lea)).hash);
    assert.strictEqual(await polls.readOwnResponse(api, poll.id, poll.key, leaLink), null);
    await polls.sendResponse(api, poll.id, poll.key, leaLink, {name: leaLink.name, availability: {"2:600": 0}, comment: ""});
    const own = await polls.readOwnResponse(api, poll.id, poll.key, leaLink);
    assert.deepStrictEqual([own.name, own.availability], ["Léa", {"2:600": 0}]);
    await polls.sendResponse(api, poll.id, poll.key, leaLink, {name: leaLink.name, availability: {"2:615": 1}, comment: "Hi"});

    // The student answers, then modifies their response.
    let saved = await polls.sendResponse(api, poll.id, poll.key, null,
        {name: "Zoé", availability: {"0:540": 0}, comment: "Not on Fridays"});
    saved = await polls.sendResponse(api, poll.id, poll.key, saved,
        {name: "Zoé", availability: {"0:540": 1, "0:555": 0}, comment: ""});
    // Someone else answers.
    await polls.sendResponse(api, poll.id, poll.key, null, {name: "Yann", availability: {"1:600": 0}, comment: ""});

    // The teacher imports the responses.
    const summary = await polls.fetchResponses(api, project);
    assert.deepStrictEqual([summary.added.sort(), summary.updated, summary.unchanged, summary.invalid],
        [["Yann", "Zoé"], ["Léa"], 0, 0]);
    assert.deepStrictEqual(lea.availability, {"2:615": 1});
    assert.strictEqual(lea.comment, "Hi");
    assert.deepStrictEqual(poll.lastImport, summary);
    const zoe = project.participants.find((p) => p.name === "Zoé");
    assert.deepStrictEqual(zoe.availability, {"0:540": 1, "0:555": 0});

    // The teacher changes the week: the poll is outdated until it is updated.
    project.calendar.step = 30;
    assert.ok(polls.isPollOutdated(project));
    await polls.updatePoll(api, project);
    assert.ok(!polls.isPollOutdated(project));
    assert.strictEqual((await polls.openPoll(api, poll.id, poll.key)).definition.calendar.step, 30);

    // Closed: the students can't answer anymore.
    await polls.setPollClosed(api, project, true);
    assert.strictEqual((await polls.openPoll(api, poll.id, poll.key)).closed, true);
    await assert.rejects(
        polls.sendResponse(api, poll.id, poll.key, saved, {name: "Zoé", availability: {}, comment: ""}),
        (error) => error instanceof polls.PollError && error.code === "closed");

    // Deleted.
    const pollId = poll.id;
    await polls.deletePoll(api, project);
    assert.strictEqual(project.poll, null);
    assert.strictEqual(lea.pollLink, undefined);
    assert.strictEqual(lea.pollUpdated, undefined);
    await assert.rejects(polls.openPoll(api, pollId, poll.key),
        (error) => error.code === "not-found" && polls.errorKey(error) === "poll.error.notFound");
});

test("polls: errors of the network and of the host", async () => {
    const offline = new polls.PollApi("", async () => {
        throw new TypeError("Failed to fetch");
    });
    await assert.rejects(offline.readPoll("x"), (error) => error.code === "network");
    // E.g. the API isn't deployed: a page of the host.
    const html = new polls.PollApi("", async () => new Response("<html>", {status: 405}));
    await assert.rejects(html.readPoll("x"), (error) => error.code === "server");
    assert.strictEqual(polls.errorKey(new Error("other")), "poll.error.server");
});
