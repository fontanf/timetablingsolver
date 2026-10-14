// Run with: node --test wasm/tests/*.test.js wasm/tests/*.test.mjs
// The sync of the projects ('web/sync.js'): links, and two devices modifying
// a project, with the API of the server ('server/api.js').

import assert from "node:assert";
import test from "node:test";

import {handleApi} from "../server/api.js";
import * as client from "../web/client.js";
import * as i18n from "../web/i18n.js";
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

function withEnglish(f) {
    const previous = i18n.getLanguage();
    i18n.setLanguage("en");
    try {
        return f();
    } finally {
        i18n.setLanguage(previous);
    }
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

test("sync: the link sent by email", () => {
    const project = model.newProject("Piano & co");
    sync.enableSync(project);
    assert.strictEqual(project.sync.saved, false);
    const email = sync.linkEmail("https://example.org/", project, (key, parameters) =>
        withEnglish(() => i18n.t(key, parameters)));
    assert.match(email, /^mailto:\?subject=.*&body=/);
    const parameters = new URLSearchParams(email.slice("mailto:?".length));
    assert.strictEqual(parameters.get("subject"), "Link of the project “Piano & co”");
    assert.ok(parameters.get("body").includes(sync.projectLink("https://example.org/", project)));
    // Kept when stored.
    project.sync.saved = true;
    assert.strictEqual(reload(project).sync.saved, true);
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
    // Opened with its link: no reminder to save it.
    assert.strictEqual(b.sync.saved, true);
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

    // A deletes the copy online: the link doesn't work anymore, until B
    // sends the project again (as after an expiration).
    await sync.deleteOnline(api, a);
    assert.strictEqual(a.sync, null);
    await assert.rejects(sync.openProject(api, link), (error) => error.code === "not-found");
    assert.deepStrictEqual(await sync.pull(api, b), {status: "expired"});
    assert.ok(sync.isModified(b));
    assert.deepStrictEqual(await sync.push(api, b), {status: "saved"});
    assert.strictEqual((await sync.openProject(api, link)).name, "Piano 2");
});

test("sync: an expired project is sent again with the same link", options, async () => {
    const {api, env} = localApi();
    const a = model.newProject("Piano");
    sync.enableSync(a);
    await sync.push(api, a);
    const link = {id: a.sync.id, key: a.sync.key};
    // Expired on the server.
    env.DB.sqlite.prepare("UPDATE projects SET expires = ?").run(Date.now() - 1);
    await assert.rejects(sync.openProject(api, link), (error) => error.code === "not-found");
    // Modified: sent again.
    a.name = "Piano 2";
    assert.deepStrictEqual(await sync.push(api, a), {status: "saved"});
    assert.strictEqual(a.sync.version, 1);
    assert.strictEqual((await sync.openProject(api, link)).name, "Piano 2");
});
