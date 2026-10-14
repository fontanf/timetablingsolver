// Sync of the projects with the server, to open them on several devices: each
// project of the user has an encrypted copy online, and a link which opens it
// on another device. No DOM here: the functions are tested with Node.
//
// The link of a project ('index.html#project=<id>&k=<key>') contains its id
// and its key: the copy online is encrypted with the key, and the token to
// read and modify it is derived from the key. Browsers don't send what is
// after '#' to the server. Anyone with the link can modify the project.
//
// The sync of a project ('project.sync'), stored in the browser:
//
//     {
//         id, key,
//         version,     // the version of the copy online the project is based on
//         signature,   // 'syncSignature' of the project when it was last sent
//                      // or received
//         saved,       // 'true' once the user saved the link (copied, sent by
//                      // email, or opened it)
//     }
//
// 'version' 0: the project isn't online (yet, or anymore: the projects expire
// two months after their last modification, see 'server/api.js').

import {ApiError, decrypt, encrypt, generateKey, randomToken} from "./client.js";
import {normalizeProject} from "./storage.js";

// The token of a project: derived from its key.
async function tokenOf(key) {
    const digest = await crypto.subtle.digest(
        "SHA-256", new TextEncoder().encode("timetablingsolver-project-token:" + key));
    let text = "";
    for (const byte of new Uint8Array(digest))
        text += String.fromCharCode(byte);
    return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Give a link to a project ('version' 0: it is sent at the next 'push').
export function enableSync(project) {
    project.sync = {id: randomToken(), key: generateKey(), version: 0, signature: "", saved: false};
}

// The link of a project as an email to send to oneself ('mailto:'): it
// doesn't go through the server. 't': the translation function.
export function linkEmail(pageUrl, project, t) {
    const name = project.name;
    const subject = t("sync.emailSubject", {name});
    const body = t("sync.emailBody", {name, link: projectLink(pageUrl, project)});
    return "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}

export function projectLink(pageUrl, project) {
    const url = new URL(pageUrl);
    url.hash = `project=${project.sync.id}&k=${project.sync.key}`;
    return url.href;
}

// '{id, key}' of the hash of the link of a project, or null.
export function parseProjectLink(hash) {
    const parameters = new URLSearchParams(hash.replace(/^#/, ""));
    const id = parameters.get("project");
    const key = parameters.get("k");
    if (!/^[A-Za-z0-9_-]{22,64}$/.test(id || "") || !/^[A-Za-z0-9_-]{43}$/.test(key || ""))
        return null;
    return {id, key};
}

// What is sent: the project, without what is about the browser.
function syncData(project) {
    const {sync, example, ...data} = project;
    return data;
}

// JSON, with the keys of the objects sorted: the order of the keys of a
// project can change when it is stored and loaded.
function stableStringify(value) {
    if (Array.isArray(value))
        return "[" + value.map(stableStringify).join(",") + "]";
    if (value !== null && typeof value === "object") {
        return "{" + Object.keys(value).sort()
            .filter((key) => value[key] !== undefined)
            .map((key) => JSON.stringify(key) + ":" + stableStringify(value[key]))
            .join(",") + "}";
    }
    return JSON.stringify(value);
}

export function syncSignature(project) {
    return stableStringify(syncData(project));
}

// 'true' if the project was modified since it was last sent or received.
export function isModified(project) {
    return project.sync !== null && project.sync !== undefined
        && (project.sync.version === 0 || syncSignature(project) !== project.sync.signature);
}

// Replace the project by a version received from the server.
function apply(project, data, version) {
    const {sync} = project;
    for (const key of Object.keys(project))
        delete project[key];
    Object.assign(project, normalizeProject(data));
    project.sync = {...sync, version, signature: syncSignature(project)};
}

// Send the project if it was modified. Returns:
// - {status: "same"}: not modified;
// - {status: "saved"};
// - {status: "conflict", version, data}: modified on another device since
//   (see 'resolveConflict').
// If the copy online expired (or was deleted), it is sent again, with the
// same link. Throws 'ApiError's (e.g. "network").
export async function push(api, project) {
    if (!isModified(project))
        return {status: "same"};
    const {sync} = project;
    const signature = syncSignature(project);
    const data = await encrypt(sync.key, syncData(project));
    const token = await tokenOf(sync.key);
    try {
        try {
            sync.version = await api.writeProject(sync.id, token, data, sync.version);
        } catch (error) {
            if (!(error instanceof ApiError && error.code === "not-found"))
                throw error;
            // Expired: created again.
            sync.version = await api.writeProject(sync.id, token, data, 0);
        }
        sync.signature = signature;
        return {status: "saved"};
    } catch (error) {
        if (error instanceof ApiError && error.code === "conflict") {
            const {version, data} = error.body;
            return {status: "conflict", version, data: await decrypt(sync.key, data)};
        }
        throw error;
    }
}

// Receive the project if it was modified on another device. Returns:
// - {status: "same"};
// - {status: "updated"};
// - {status: "conflict", version, data}: modified here too (see
//   'resolveConflict');
// - {status: "expired"}: the copy online expired (or was deleted): it is sent
//   again at the next 'push', with the same link.
export async function pull(api, project) {
    const {sync} = project;
    if (sync.version === 0)
        return {status: "same"};
    let read;
    try {
        read = await api.readProject(sync.id, await tokenOf(sync.key));
    } catch (error) {
        if (error instanceof ApiError && error.code === "not-found") {
            sync.version = 0;
            return {status: "expired"};
        }
        throw error;
    }
    if (read.version === sync.version)
        return {status: "same"};
    const data = await decrypt(sync.key, read.data);
    if (isModified(project))
        return {status: "conflict", version: read.version, data};
    apply(project, data, read.version);
    return {status: "updated"};
}

// After a conflict: keep the version of this device (it replaces the one
// online at the next 'push'), or the one of the other device.
export function resolveConflict(project, {version, data}, keepLocal) {
    if (keepLocal) {
        project.sync.version = version;
        project.sync.signature = "";
    } else {
        apply(project, data, version);
    }
}

// The project of a link, opened on another device.
export async function openProject(api, {id, key}) {
    const read = await api.readProject(id, await tokenOf(key));
    const project = normalizeProject(await decrypt(key, read.data));
    // Opened with its link: the user has it.
    project.sync = {id, key, version: read.version, signature: syncSignature(project), saved: true};
    return project;
}

// Delete the copy online: the link doesn't work anymore.
export async function deleteOnline(api, project) {
    const {sync} = project;
    project.sync = null;
    if (sync.version === 0)
        return;
    try {
        await api.deleteProject(sync.id, await tokenOf(sync.key));
    } catch (error) {
        if (!(error instanceof ApiError && error.code === "not-found"))
            throw error;
    }
}
