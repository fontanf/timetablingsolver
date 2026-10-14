// Storage of the projects in the browser (localStorage), and their export to
// and import from JSON files.

import {t} from "./i18n.js";
import {EXAMPLE_ID, alignCalendar, defaultParameters, newId, normalizeCalendar} from "./model.js";

const STORAGE_KEY = "timetablingsolver.projects";

export const EXPORT_FORMAT = "timetablingsolver-project";
export const EXPORT_VERSION = 1;

// Projects kept in memory, when they can't be stored in the browser (e.g. in
// a private window, or with the storage disabled).
export class MemoryStore {
    constructor() {
        this.projects = [];
        this.persistent = false;
    }

    load() {
        return structuredClone(this.projects);
    }

    save(projects) {
        this.projects = structuredClone(projects.filter((p) => !p.example));
    }
}

export class LocalStorageStore {
    constructor(storage) {
        this.storage = storage;
        this.persistent = true;
    }

    load() {
        const text = this.storage.getItem(STORAGE_KEY);
        if (text === null)
            return [];
        const projects = JSON.parse(text);
        if (!Array.isArray(projects))
            return [];
        // The first versions stored the example, which could be modified: it
        // is kept as a project of the user.
        return projects.map(normalizeProject).map((p) => p.id === EXAMPLE_ID? {...p, id: newId()}: p);
    }

    // The example isn't stored.
    save(projects) {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(projects.filter((p) => !p.example)));
    }
}

// The store of the projects: localStorage if available, otherwise in memory.
export function openStore() {
    try {
        const storage = globalThis.localStorage;
        const key = STORAGE_KEY + ".test";
        storage.setItem(key, "1");
        storage.removeItem(key);
        return new LocalStorageStore(storage);
    } catch (error) {
        console.error(error);
        return new MemoryStore();
    }
}

// A project with the missing fields filled with their defaults (projects of
// older versions, imported files).
export function normalizeProject(project) {
    const normalized = {
        id: typeof project.id === "string"? project.id: newId(),
        name: typeof project.name === "string"? project.name: t("project.defaultName"),
        created: typeof project.created === "number"? project.created: Date.now(),
        calendar: normalizeCalendar(project.calendar),
        participants: (Array.isArray(project.participants)? project.participants: []).map(normalizeParticipant),
        courses: (Array.isArray(project.courses)? project.courses: []).map((c) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            duration: Number(c.duration),
            participants: Array.isArray(c.participants)? c.participants.map(String): [],
        })),
        parameters: {
            ...defaultParameters(),
            // The first versions had the score of the unavailable slots too.
            timeLimit: Number((project.parameters || {}).timeLimit) || defaultParameters().timeLimit,
        },
        result: project.result ?? null,
        poll: normalizePoll(project.poll),
        sync: normalizeSync(project.sync),
    };
    // The week and the availabilities of the organizer (set separately by the
    // first versions).
    alignCalendar(normalized);
    return normalized;
}

// See 'sync.js'.
function normalizeSync(sync) {
    if (sync === null || typeof sync !== "object" || typeof sync.id !== "string" || typeof sync.key !== "string")
        return null;
    return {
        id: sync.id,
        key: sync.key,
        version: Number.isInteger(sync.version)? sync.version: 0,
        signature: typeof sync.signature === "string"? sync.signature: "",
    };
}

function normalizeParticipant(p) {
    const participant = {
        id: String(p.id),
        name: String(p.name ?? ""),
        role: p.role === "teacher"? "teacher": "student",
        availability: (p.availability && typeof p.availability === "object")? {...p.availability}: {},
    };
    // About the poll (see 'polls.js').
    const isString = (value) => typeof value === "string";
    if (p.pollLink && isString(p.pollLink.pollId) && isString(p.pollLink.responseId) && isString(p.pollLink.token))
        participant.pollLink = {pollId: p.pollLink.pollId, responseId: p.pollLink.responseId, token: p.pollLink.token};
    if (Array.isArray(p.pollResponseIds) && p.pollResponseIds.length > 0) {
        participant.pollResponseIds = p.pollResponseIds.filter(isString);
        participant.pollUpdated = Number(p.pollUpdated) || 0;
    }
    if (isString(p.comment) && p.comment !== "")
        participant.comment = p.comment;
    return participant;
}

// See 'polls.js'.
function normalizePoll(poll) {
    if (poll === null || typeof poll !== "object"
            || typeof poll.id !== "string" || typeof poll.key !== "string" || typeof poll.adminToken !== "string")
        return null;
    return {
        id: poll.id,
        key: poll.key,
        adminToken: poll.adminToken,
        message: typeof poll.message === "string"? poll.message: "",
        signature: typeof poll.signature === "string"? poll.signature: "",
        closed: poll.closed === true,
        created: Number(poll.created) || 0,
        lastImport: (poll.lastImport && typeof poll.lastImport === "object")? poll.lastImport: null,
    };
}

// Without the link of the project (see 'sync.js'): its key gives access to the
// copy online.
export function exportProject(project) {
    const {sync, ...exported} = project;
    return JSON.stringify({format: EXPORT_FORMAT, version: EXPORT_VERSION, project: exported}, null, 2);
}

// The project of an exported file, with a new id so that it doesn't replace
// an existing project.
export function importProject(text) {
    let json;
    try {
        json = JSON.parse(text);
    } catch (error) {
        throw new Error(t("import.invalidJson"));
    }
    if (json === null || json.format !== EXPORT_FORMAT || typeof json.project !== "object")
        throw new Error(t("import.invalidFormat"));
    if (json.version > EXPORT_VERSION)
        throw new Error(t("import.newerVersion"));
    // A copy: without the link of the project.
    return {...normalizeProject(json.project), id: newId(), created: Date.now(), sync: null};
}

// 'name', or 'name (2)', 'name (3)'... if it is already used.
export function uniqueName(name, usedNames) {
    const used = new Set(usedNames);
    if (!used.has(name))
        return name;
    for (let i = 2; ; ++i) {
        const candidate = `${name} (${i})`;
        if (!used.has(candidate))
            return candidate;
    }
}

// The preferences of the page (e.g. the language), in localStorage: they are
// only conveniences, so the errors are ignored.
export function readPreference(key) {
    try {
        return localStorage.getItem("timetablingsolver." + key);
    } catch (error) {
        return null;
    }
}

export function writePreference(key, value) {
    try {
        localStorage.setItem("timetablingsolver." + key, value);
    } catch (error) {
        // Not stored.
    }
}
