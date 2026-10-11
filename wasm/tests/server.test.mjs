// Run with: node --test wasm/tests/*.test.js wasm/tests/*.test.mjs
// The API of the polls ('server/api.js'), with an in-memory SQLite database
// behind the interface of Cloudflare D1. Requires 'node:sqlite' (Node 22.13+).

import assert from "node:assert";
import test from "node:test";

import {LIMITS, handleApi} from "../server/api.js";
import {FakeD1, hasSqlite} from "./fake_d1.mjs";

const ADMIN = "admin-token-0123456789abcdef";
const STUDENT = "student-token-0123456789abcdef";
const OTHER = "other-token-0123456789abcdefgh";
const RESPONSE_ID = "response-id-0123456789abcdef";

function api(env) {
    return async (method, path, {token, body} = {}) => {
        const headers = {};
        if (token !== undefined)
            headers.Authorization = "Bearer " + token;
        if (body !== undefined)
            headers["Content-Type"] = "application/json";
        const response = await handleApi(new Request("https://example.org" + path, {
            method,
            headers,
            body: body === undefined? undefined: (typeof body === "string"? body: JSON.stringify(body)),
        }), env);
        const text = await response.text();
        return {status: response.status, body: text === ""? null: JSON.parse(text)};
    };
}

const options = {skip: hasSqlite? false: "node:sqlite isn't available"};

test("server: polls", options, async () => {
    const request = api({DB: new FakeD1()});

    // Creation.
    assert.deepStrictEqual(await request("POST", "/api/polls", {body: {adminToken: "short", definition: "d"}}),
        {status: 400, body: {error: "invalid-body"}});
    const created = await request("POST", "/api/polls", {body: {adminToken: ADMIN, definition: "definition 1"}});
    assert.strictEqual(created.status, 201);
    const pollId = created.body.pollId;
    assert.match(pollId, /^[A-Za-z0-9_-]{22}$/);

    // Reading, by anyone.
    assert.deepStrictEqual(await request("GET", `/api/polls/${pollId}`),
        {status: 200, body: {definition: "definition 1", closed: false}});
    assert.strictEqual((await request("GET", "/api/polls/unknown-poll-0123456789abc")).status, 404);
    assert.strictEqual((await request("GET", "/api/polls/bad")).status, 404);

    // Modification, by the teacher.
    assert.strictEqual((await request("PUT", `/api/polls/${pollId}`, {body: {definition: "x"}})).status, 401);
    assert.strictEqual((await request("PUT", `/api/polls/${pollId}`, {token: OTHER, body: {definition: "x"}})).status, 403);
    assert.deepStrictEqual(await request("PUT", `/api/polls/${pollId}`, {token: ADMIN, body: {definition: "definition 2"}}),
        {status: 200, body: {definition: "definition 2", closed: false}});
    assert.strictEqual((await request("PUT", `/api/polls/${pollId}`, {token: ADMIN, body: {closed: "yes"}})).status, 400);

    // Deletion.
    assert.strictEqual((await request("DELETE", `/api/polls/${pollId}`, {token: OTHER})).status, 403);
    assert.strictEqual((await request("DELETE", `/api/polls/${pollId}`, {token: ADMIN})).status, 204);
    assert.strictEqual((await request("GET", `/api/polls/${pollId}`)).status, 404);
});

test("server: responses", options, async () => {
    const request = api({DB: new FakeD1()});
    const {pollId} = (await request("POST", "/api/polls", {body: {adminToken: ADMIN, definition: "d"}})).body;
    const responses = `/api/polls/${pollId}/responses`;

    // A student creates a response, then modifies it with the same token.
    assert.strictEqual((await request("PUT", `${responses}/${RESPONSE_ID}`, {body: {data: "a"}})).status, 401);
    assert.strictEqual((await request("PUT", `${responses}/${RESPONSE_ID}`, {token: STUDENT, body: {data: "a"}})).status, 201);
    assert.strictEqual((await request("PUT", `${responses}/${RESPONSE_ID}`, {token: STUDENT, body: {data: "b"}})).status, 200);
    // The student reads their response.
    assert.strictEqual((await request("GET", `${responses}/${RESPONSE_ID}`)).status, 401);
    assert.strictEqual((await request("GET", `${responses}/${RESPONSE_ID}`, {token: OTHER})).status, 403);
    assert.strictEqual((await request("GET", `${responses}/${RESPONSE_ID}1`, {token: STUDENT})).status, 404);
    const own = await request("GET", `${responses}/${RESPONSE_ID}`, {token: STUDENT});
    assert.strictEqual(own.body.data, "b");
    assert.ok(own.body.updated > 0);
    // Someone else can't modify it.
    assert.strictEqual((await request("PUT", `${responses}/${RESPONSE_ID}`, {token: OTHER, body: {data: "c"}})).status, 403);
    assert.strictEqual((await request("PUT", `${responses}/${RESPONSE_ID}`, {token: STUDENT, body: {data: ""}})).status, 400);
    assert.strictEqual((await request("PUT", `${responses}/bad`, {token: STUDENT, body: {data: "c"}})).status, 404);

    // Only the teacher reads the responses.
    assert.strictEqual((await request("GET", responses)).status, 401);
    assert.strictEqual((await request("GET", responses, {token: STUDENT})).status, 403);
    const read = await request("GET", responses, {token: ADMIN});
    assert.strictEqual(read.status, 200);
    assert.deepStrictEqual(read.body.responses.map((r) => [r.id, r.data]), [[RESPONSE_ID, "b"]]);
    assert.ok(read.body.responses[0].updated > 0);

    // A closed poll doesn't accept responses.
    await request("PUT", `/api/polls/${pollId}`, {token: ADMIN, body: {closed: true}});
    assert.deepStrictEqual((await request("GET", `/api/polls/${pollId}`)).body.closed, true);
    assert.deepStrictEqual(await request("PUT", `${responses}/${RESPONSE_ID}`, {token: STUDENT, body: {data: "c"}}),
        {status: 403, body: {error: "closed"}});

    // Deleting the poll deletes its responses.
    await request("DELETE", `/api/polls/${pollId}`, {token: ADMIN});
    assert.strictEqual((await request("GET", responses, {token: ADMIN})).status, 404);
});

test("server: limits", options, async () => {
    const request = api({DB: new FakeD1()});
    assert.deepStrictEqual(
        await request("POST", "/api/polls", {body: {adminToken: ADMIN, definition: "x".repeat(LIMITS.definitionLength + 1)}}),
        {status: 413, body: {error: "too-large"}});
    const {pollId} = (await request("POST", "/api/polls", {body: {adminToken: ADMIN, definition: "d"}})).body;
    const responses = `/api/polls/${pollId}/responses`;
    assert.strictEqual((await request("PUT", `${responses}/${RESPONSE_ID}`, {
        token: STUDENT, body: {data: "x".repeat(LIMITS.responseLength + 1)}})).status, 413);

    const responsesPerPoll = LIMITS.responsesPerPoll;
    LIMITS.responsesPerPoll = 2;
    try {
        for (const i of [1, 2])
            assert.strictEqual((await request("PUT", `${responses}/${RESPONSE_ID}${i}`, {token: STUDENT, body: {data: "d"}})).status, 201);
        assert.deepStrictEqual(await request("PUT", `${responses}/${RESPONSE_ID}3`, {token: STUDENT, body: {data: "d"}}),
            {status: 403, body: {error: "too-many-responses"}});
        // The existing responses can still be modified.
        assert.strictEqual((await request("PUT", `${responses}/${RESPONSE_ID}1`, {token: STUDENT, body: {data: "e"}})).status, 200);
    } finally {
        LIMITS.responsesPerPoll = responsesPerPoll;
    }
});

test("server: expired polls are removed", options, async () => {
    const db = new FakeD1();
    const request = api({DB: db});
    const {pollId} = (await request("POST", "/api/polls", {body: {adminToken: ADMIN, definition: "d"}})).body;
    await request("PUT", `/api/polls/${pollId}/responses/${RESPONSE_ID}`, {token: STUDENT, body: {data: "d"}});
    db.sqlite.prepare("UPDATE polls SET expires = ?").run(Date.now() - 1);
    assert.strictEqual((await request("GET", `/api/polls/${pollId}`)).status, 404);
    // Removed when another poll is created.
    await request("POST", "/api/polls", {body: {adminToken: ADMIN, definition: "d"}});
    assert.strictEqual(db.sqlite.prepare("SELECT COUNT(*) AS n FROM polls").get().n, 1);
    assert.strictEqual(db.sqlite.prepare("SELECT COUNT(*) AS n FROM responses").get().n, 0);
});

test("server: errors", options, async () => {
    assert.deepStrictEqual(await api({})("GET", "/api/polls/x"), {status: 503, body: {error: "no-database"}});
    const request = api({DB: new FakeD1()});
    assert.strictEqual((await request("GET", "/api/other")).status, 404);
    assert.strictEqual((await request("PATCH", "/api/polls")).status, 405);
    assert.strictEqual((await request("POST", "/api/polls", {body: "not json"})).status, 400);
});
