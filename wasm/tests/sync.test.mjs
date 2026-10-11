// Run with: node --test wasm/tests/*.test.js wasm/tests/*.test.mjs
// The sync of the projects ('web/sync.js'): links, and two devices modifying
// a project, with the API of the server ('server/api.js').

import assert from "node:assert";
import test from "node:test";

import {handleApi} from "../server/api.js";
import * as client from "../web/client.js";
import * as model from "../web/model.js";
import * as storage from "../web/storage.js";
import * as sync from "../web/sync.js";
import {FakeD1, hasSqlite} from "./fake_d1.mjs";

const options = {skip: hasSqlite? false: "node:sqlite isn't available"};

// The API of the server, called without network.
function localApi() {
    const env = {DB: new FakeD1()};
    return {env, api: new client.Api("https://example.org", (url, init) => handleApi(new Request(url, init), env))};
}

// The project as stored and loaded by a browser.
const reload = (project) => storage.normalizeProject(JSON.parse(JSON.stringify(project)));

test("sync: links", () => {
    const project = model.newProject("Test");
    sync.enableSync(project);
    const link = sync.projectLink("https://example.org/app/index.html?x#y", project);
    assert.strictEqual(link, `https://example.org/app/index.html?x#project=${project.sync.id}&k=${project.sync.key}`);
    assert.deepStrictEqual(sync.parseProjectLink(new URL(link).hash), {id: project.sync.id, key: project.sync.key});
    assert.strictEqual(sync.parseProjectLink("#p=abc"), null);
});

test("sync: what is modified", () => {
    const project = model.newProject("Test");
    sync.enableSync(project);
    // Not online yet.
    assert.ok(sync.isModified(project));
    project.sync.version = 1;
    project.sync.signature = sync.syncSignature(project);
    assert.ok(!sync.isModified(project));
    // Stored and loaded: the order of the keys may change, not the project.
    const loaded = reload(project);
    assert.ok(!sync.isModified(loaded));
    loaded.participants[0].name = "M. Durand";
    assert.ok(sync.isModified(loaded));
    // Without link.
    assert.ok(!sync.isModified(model.newProject("Other")));
});

test("sync: exported projects don't contain their link", () => {
    const project = model.newProject("Test");
    sync.enableSync(project);
    const exported = storage.exportProject(project);
    assert.ok(!exported.includes(project.sync.key));
    assert.strictEqual(storage.importProject(exported).sync, null);
});

test("sync: two devices", options, async () => {
    const {api, env} = localApi();

    // Device A creates a project: it is sent.
    const a = model.newProject("Piano");
    sync.enableSync(a);
    assert.deepStrictEqual(await sync.push(api, a), {status: "saved"});
    assert.strictEqual(a.sync.version, 1);
    assert.deepStrictEqual(await sync.push(api, a), {status: "same"});
    // The server can't read it.
    const stored = env.DB.sqlite.prepare("SELECT data FROM projects").get().data;
    assert.ok(!stored.includes("Piano"));

    // Device B opens the link.
    const link = sync.parseProjectLink(new URL(sync.projectLink("https://example.org/", a)).hash);
    const b = await sync.openProject(api, link);
    assert.strictEqual(b.name, "Piano");
    assert.strictEqual(b.id, a.id);
    assert.ok(!sync.isModified(b));
    // With a wrong key, it can't be opened.
    await assert.rejects(sync.openProject(api, {id: link.id, key: client.generateKey()}),
        (error) => error.code === "forbidden");

    // B modifies it; A receives the modification.
    model.addStudent(b, "Alice");
    assert.deepStrictEqual(await sync.push(api, b), {status: "saved"});
    assert.deepStrictEqual(await sync.pull(api, a), {status: "updated"});
    assert.deepStrictEqual(a.participants.slice(1).map((p) => p.name), ["Alice"]);
    assert.strictEqual(a.sync.version, 2);
    assert.deepStrictEqual(await sync.pull(api, a), {status: "same"});

    // Both modify it: conflict.
    a.name = "Piano A";
    b.name = "Piano B";
    assert.deepStrictEqual(await sync.push(api, b), {status: "saved"});
    let conflict = await sync.push(api, a);
    assert.strictEqual(conflict.status, "conflict");
    assert.strictEqual(conflict.data.name, "Piano B");
    // A keeps its version: it replaces the one online.
    sync.resolveConflict(a, conflict, true);
    assert.deepStrictEqual(await sync.push(api, a), {status: "saved"});
    conflict = await sync.pull(api, b);
    assert.deepStrictEqual(conflict, {status: "updated"});
    assert.strictEqual(b.name, "Piano A");

    // Conflict seen when receiving; B takes the version online.
    a.name = "Piano 2";
    await sync.push(api, a);
    b.name = "Piano 3";
    conflict = await sync.pull(api, b);
    assert.strictEqual(conflict.status, "conflict");
    sync.resolveConflict(b, conflict, false);
    assert.strictEqual(b.name, "Piano 2");
    assert.ok(!sync.isModified(b));

    // A deletes the copy online: B's project loses its link, and stays.
    await sync.deleteOnline(api, a);
    assert.strictEqual(a.sync, null);
    assert.deepStrictEqual(await sync.pull(api, b), {status: "deleted"});
    assert.strictEqual(b.sync, null);
    await assert.rejects(sync.openProject(api, link), (error) => error.code === "not-found");
});

test("sync: a project modified by another device is deleted", options, async () => {
    const {api} = localApi();
    const a = model.newProject("Piano");
    sync.enableSync(a);
    await sync.push(api, a);
    const b = await sync.openProject(api, {id: a.sync.id, key: a.sync.key});
    await sync.deleteOnline(api, b);
    a.name = "Piano 2";
    assert.deepStrictEqual(await sync.push(api, a), {status: "deleted"});
    assert.strictEqual(a.sync, null);
});
