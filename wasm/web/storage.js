// Storage of the projects in the browser (localStorage), and their export to
// and import from JSON files.

import {t} from "./i18n.js";
import {defaultParameters, newId, normalizeCalendar} from "./model.js";

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
        this.projects = structuredClone(projects);
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
        return Array.isArray(projects)? projects.map(normalizeProject): [];
    }

    save(projects) {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(projects));
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
    return {
        id: typeof project.id === "string"? project.id: newId(),
        name: typeof project.name === "string"? project.name: t("project.defaultName"),
        created: typeof project.created === "number"? project.created: Date.now(),
        calendar: normalizeCalendar(project.calendar),
        participants: (Array.isArray(project.participants)? project.participants: []).map((p) => ({
            id: String(p.id),
            name: String(p.name ?? ""),
            role: p.role === "teacher"? "teacher": "student",
            availability: (p.availability && typeof p.availability === "object")? {...p.availability}: {},
        })),
        courses: (Array.isArray(project.courses)? project.courses: []).map((c) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            duration: Number(c.duration),
            participants: Array.isArray(c.participants)? c.participants.map(String): [],
        })),
        parameters: {...defaultParameters(), ...(project.parameters || {})},
        result: project.result ?? null,
    };
}

export function exportProject(project) {
    return JSON.stringify({format: EXPORT_FORMAT, version: EXPORT_VERSION, project}, null, 2);
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
    return {...normalizeProject(json.project), id: newId(), created: Date.now()};
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
