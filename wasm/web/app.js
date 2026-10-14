// The web page: the projects of the teacher, their forms, the availability
// grid, the optimization (in a Web Worker) and the timetable.

import * as grid from "./availability_grid.js";
import * as client from "./client.js";
import * as i18n from "./i18n.js";
import {t} from "./i18n.js";
import * as model from "./model.js";
import * as polls from "./polls.js";
import * as storage from "./storage.js";
import * as sync from "./sync.js";

const $ = (id) => document.getElementById(id);

// Height of a slot in the timetable, in pixels.
const TIMETABLE_SLOT_HEIGHT = 18;

const store = storage.openStore();
let projects = [];
let project = null;

// Worker of the running optimization, or null.
let worker = null;

/////////////////////////////////////////////////////////////////////////////
// Projects
/////////////////////////////////////////////////////////////////////////////

// The projects: the example first, then the projects of the user.
function loadProjects() {
    try {
        projects = store.load();
    } catch (error) {
        console.error(error);
        projects = [];
    }
    projects.unshift(model.exampleProject());
    const currentId = storage.readPreference("current");
    project = projects.find((p) => p.id === currentId) || projects[0];
}

// The example in the language of the page.
function translateExample() {
    const example = model.exampleProject();
    const index = projects.findIndex((p) => p.example);
    if (project === projects[index])
        project = example;
    projects[index] = example;
}

// Store the projects in the browser, and send the modified ones online.
function save() {
    persist();
    // Shown as soon as there is something to send.
    if (!project.example && sync.isModified(project))
        setSyncState(project, "saving");
    scheduleSync();
}

function persist() {
    // The new projects get their link (sent at the next sync).
    for (const target of projects) {
        if (target.example)
            continue;
        if (target.sync === null)
            sync.enableSync(target);
        if (target.poll === null)
            polls.newPoll(target);
    }
    try {
        store.save(projects);
    } catch (error) {
        console.error(error);
        showStorageWarning();
    }
    storage.writePreference("current", project.id);
}

function showStorageWarning() {
    $("storage-warning").hidden = false;
}

function selectProject(id) {
    stopOptimization();
    project = projects.find((p) => p.id === id) || projects[0];
    selectedParticipantId = null;
    save();
    renderAll();
    pullProject(project);
}

function askName(message, name) {
    const answer = prompt(message, name);
    if (answer === null || answer.trim() === "")
        return null;
    return storage.uniqueName(answer.trim(), projects.filter((p) => p !== project).map((p) => p.name));
}

function initProjectBar() {
    $("project-select").addEventListener("change", (event) => selectProject(event.target.value));
    $("project-new").addEventListener("click", () => {
        const name = askName(t("project.newPrompt"), t("project.newDefault"));
        if (name === null)
            return;
        const created = model.newProject(name);
        projects.push(created);
        selectProject(created.id);
    });
    $("project-rename").addEventListener("click", () => {
        if (project.example)
            return;
        const name = askName(t("project.renamePrompt"), project.name);
        if (name === null)
            return;
        project.name = name;
        save();
        renderProjectBar();
        renderPoll();
    });
    const duplicate = () => {
        const copy = {
            ...structuredClone(project),
            id: model.newId(),
            name: storage.uniqueName(t("project.copySuffix", {name: project.name}), projects.map((p) => p.name)),
            created: Date.now(),
        };
        delete copy.example;
        // A link of its own (see 'syncAll').
        copy.sync = null;
        // The poll stays with the original project: a new one (see 'persist').
        copy.poll = null;
        for (const participant of copy.participants) {
            delete participant.pollLink;
            delete participant.pollResponseIds;
            delete participant.pollUpdated;
        }
        projects.push(copy);
        selectProject(copy.id);
    };
    $("project-duplicate").addEventListener("click", duplicate);
    $("example-duplicate").addEventListener("click", duplicate);
    $("project-delete").addEventListener("click", () => {
        if (project.example || !confirm(t("project.deleteConfirm", {name: project.name})))
            return;
        // The poll of the project and its responses, on the server (they
        // expire anyway).
        if (project.poll !== null)
            polls.deletePoll(api, project).catch((error) => console.error(error));
        if (project.sync !== null)
            sync.deleteOnline(api, project).catch((error) => console.error(error));
        projects = projects.filter((p) => p !== project);
        selectProject(projects[0].id);
    });
    $("project-export").addEventListener("click", () => {
        download(project.name + ".json", storage.exportProject(project), "application/json");
    });
    $("project-import").addEventListener("click", () => $("project-import-file").click());
    $("project-import-file").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        event.target.value = "";
        if (file === undefined)
            return;
        try {
            const imported = storage.importProject(await file.text());
            imported.name = storage.uniqueName(imported.name, projects.map((p) => p.name));
            projects.push(imported);
            selectProject(imported.id);
        } catch (error) {
            alert(t("project.importError", {error: error.message}));
        }
    });
}

function renderProjectBar() {
    const select = $("project-select");
    select.replaceChildren(...projects.map((p) =>
        new Option(p.example? t("project.exampleOption"): p.name, p.id, false, p === project)));
    $("project-rename").disabled = project.example === true;
    $("project-delete").disabled = project.example === true;
    $("example-banner").hidden = project.example !== true;
}

// The example can't be modified: the fields of the sections are disabled,
// except those which only change what is shown ('keep-enabled').
const EDITABLE_SECTIONS = [
    "calendar-section", "participants-section", "availability-section", "courses-section", "solve-section"];

function lockExample(root) {
    for (const element of root.querySelectorAll("input, select, button, textarea")) {
        // Managed by 'renderChecks'.
        if (element.id === "solve" || element.id === "stop" || element.classList.contains("keep-enabled"))
            continue;
        element.disabled = project.example === true;
    }
}

function lockExampleSections() {
    for (const id of EDITABLE_SECTIONS)
        lockExample($(id));
}

function download(fileName, content, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Called after each modification of the project.
function changed(...sections) {
    save();
    for (const section of sections)
        section();
    renderChecks();
    renderResultOutdated();
    renderPoll();
}

/////////////////////////////////////////////////////////////////////////////
// Calendar
/////////////////////////////////////////////////////////////////////////////

// The availabilities of the organizer, which define the week (see
// 'setOrganizerAvailability' in 'model.js'), as they were when the grid was
// rendered.
let renderedOrganizerAvailability = {};

function initCalendar() {
    $("calendar-step").addEventListener("change", (event) => {
        project.calendar.step = Number(event.target.value);
        // The availabilities on the slots of the new step.
        model.alignCalendar(project);
        changed(renderCalendar, renderAvailabilityGrid, renderParticipants);
    });
    grid.attachPainting($("week-grid"), {
        availability: () => {
            const organizer = model.teacherOf(project);
            return (project.example || organizer === null)? null: organizer.availability;
        },
        brush: () => grid.brush("week-brush"),
        onChange: () => {
            // Only the days painted: the time ranges of the others are kept,
            // even if they aren't aligned on the step.
            const availability = model.teacherOf(project).availability;
            const painted = new Set();
            for (const key of new Set([...Object.keys(availability), ...Object.keys(renderedOrganizerAvailability)]))
                if ((key in availability) !== (key in renderedOrganizerAvailability))
                    painted.add(model.parseSlotKey(key).day);
            model.setOrganizerAvailability(project, availability, [...painted]);
            changed(renderCalendar, renderAvailabilityGrid, renderParticipants);
        },
    });
}

function renderCalendar() {
    const {calendar} = project;
    $("calendar-step").replaceChildren(...model.STEPS.map((step) =>
        new Option(t("calendar.minutes", {minutes: step}), step, false, step === calendar.step)));
    $("calendar-empty").hidden = model.usedDays(calendar).length > 0;
    const organizer = model.teacherOf(project);
    const availability = organizer === null? {}: organizer.availability;
    renderedOrganizerAvailability = {...availability};
    // All the days, with the same hours.
    const hours = model.weekGridHours(calendar);
    grid.renderGrid($("week-grid"), {
        calendar: {step: calendar.step, days: calendar.days.map(() => ({ranges: [hours]}))},
        availability,
    });
    lockExample($("calendar-section"));
}

/////////////////////////////////////////////////////////////////////////////
// Sync (see 'sync.js')
/////////////////////////////////////////////////////////////////////////////

// The state of the sync of the projects: project id -> {state, error}, where
// 'state' is "saving", "saved", "offline" or "error".
const syncStates = new Map();

let syncTimer = null;
let syncing = false;
let syncAgain = false;

function setSyncState(target, state, error = null) {
    syncStates.set(target.id, {state, error});
    if (target === project)
        renderSync();
}

function scheduleSync(delay = 1500) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncAll, delay);
}

// Send the modified projects; the projects without link get one.
async function syncAll() {
    if (syncing) {
        syncAgain = true;
        return;
    }
    syncing = true;
    for (const target of [...projects]) {
        if (target.example)
            continue;
        if (target.sync === null)
            sync.enableSync(target);
        // Before the project: it is modified (e.g. the date of creation of the
        // poll).
        await publishPoll(target);
        if (!sync.isModified(target))
            continue;
        setSyncState(target, "saving");
        try {
            await handleSyncResult(target, await sync.push(api, target));
        } catch (error) {
            console.error(error);
            setSyncState(target, error.code === "network"? "offline": "error", error);
        }
    }
    persist();
    syncing = false;
    if (syncAgain) {
        syncAgain = false;
        scheduleSync(0);
    }
}

// Receive the project if it was modified on another device.
async function pullProject(target) {
    if (target.example || target.sync === null || syncing)
        return;
    try {
        await handleSyncResult(target, await sync.pull(api, target));
        persist();
    } catch (error) {
        console.error(error);
        setSyncState(target, error.code === "network"? "offline": "error", error);
    }
    await fetchAnswers(target, true);
}

async function handleSyncResult(target, result) {
    if (result.status === "conflict") {
        const keepLocal = !confirm(t("sync.conflict", {name: target.name}));
        sync.resolveConflict(target, result, keepLocal);
        if (keepLocal)
            scheduleSync(0);
        else if (target === project)
            renderAll();
        setSyncState(target, "saved");
    } else if (result.status === "expired") {
        // Sent again, with the same link.
        scheduleSync(0);
    } else {
        if (result.status === "updated" && target === project)
            renderAll();
        // "Saved" only if there is nothing left to send (e.g. not a new project
        // which wasn't sent yet).
        if (!sync.isModified(target))
            setSyncState(target, "saved");
    }
}

function initSync() {
    $("project-link").addEventListener("click", () => {
        const panel = $("project-link-panel");
        panel.hidden = !panel.hidden;
        $("project-link").setAttribute("aria-expanded", String(!panel.hidden));
        renderSync();
    });
    $("project-link-copy").addEventListener("click", (event) => {
        copyText($("project-link-input").value, event.target);
        linkSaved();
    });
    const sendEmail = () => {
        location.href = sync.linkEmail(location.href, project, t);
        linkSaved();
    };
    $("project-link-email").addEventListener("click", sendEmail);
    $("link-reminder-email").addEventListener("click", sendEmail);
    $("link-reminder-copy").addEventListener("click", (event) => {
        copyText(sync.projectLink(location.href, project), event.target);
        // After the message 'Copied!'.
        const target = project;
        setTimeout(() => linkSaved(target), 1500);
    });
    $("link-reminder-done").addEventListener("click", () => linkSaved());
    $("project-link-input").addEventListener("focus", (event) => event.target.select());
    // Back to the page: the project may have been modified on another device.
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible")
            pullProject(project);
    });
    window.addEventListener("online", () => scheduleSync(0));
    // A link of a project opened in this page.
    window.addEventListener("hashchange", openLinkOfPage);
}

// The project of the link of the page ('#project=...'), if any.
async function openLinkOfPage() {
    const link = sync.parseProjectLink(location.hash);
    if (link === null)
        return;
    // Not kept in the address of the page (nor in its history).
    history.replaceState(null, "", location.pathname + location.search);
    const existing = projects.find((p) => p.sync !== null && p.sync !== undefined && p.sync.id === link.id);
    if (existing !== undefined) {
        selectProject(existing.id);
        return;
    }
    try {
        const opened = await sync.openProject(api, link);
        // The same project, deleted online and opened again.
        if (projects.some((p) => p.id === opened.id))
            opened.id = model.newId();
        projects.push(opened);
        selectProject(opened.id);
    } catch (error) {
        console.error(error);
        const reason = (error.code === "not-found")? t("sync.notFound"): t(client.errorKey(error));
        alert(t("sync.openError", {error: reason}));
    }
}

// The user saved the link of a project: no more reminder.
function linkSaved(target = project) {
    if (target.sync === null || target.sync === undefined || target.sync.saved)
        return;
    target.sync.saved = true;
    persist();
    renderSync();
}

function renderSync() {
    $("link-reminder").hidden = project.example === true || project.sync === null || project.sync === undefined
        || project.sync.saved;
    const isExample = project.example === true;
    $("project-link").hidden = isExample;
    $("project-link-panel").hidden = isExample || $("project-link").getAttribute("aria-expanded") !== "true";
    if (project.sync !== null && project.sync !== undefined)
        $("project-link-input").value = sync.projectLink(location.href, project);
    const status = $("sync-status");
    const {state, error} = syncStates.get(project.id) || {state: null, error: null};
    status.className = "sync-status";
    status.textContent = "";
    if (isExample || state === null)
        return;
    if (state === "offline" || state === "error")
        status.classList.add("problem");
    status.textContent = {
        "saving": () => t("sync.saving"),
        "saved": () => "✓ " + t("sync.saved"),
        "offline": () => t("sync.offline"),
        "error": () => t("sync.error", {error: t(client.errorKey(error))}),
    }[state]();
}

/////////////////////////////////////////////////////////////////////////////
// Poll
/////////////////////////////////////////////////////////////////////////////

const api = new client.Api();

// 'true' during a request to the server.
let pollBusy = false;

// The state of the polls online: project id -> {state, error}, where 'state'
// is "publishing", "published", "offline" or "error" (see 'syncAll').
const pollStates = new Map();

function setPollState(target, state, error = null) {
    pollStates.set(target.id, {state, error});
    if (target === project)
        renderPollStatus();
}

// Create or update the poll of a project on the server, if needed.
async function publishPoll(target) {
    if (!polls.needsPublish(target))
        return;
    setPollState(target, "publishing");
    try {
        await polls.publishPoll(api, target);
        setPollState(target, "published");
    } catch (error) {
        console.error(error);
        setPollState(target, error.code === "network"? "offline": "error", error);
    }
}

// Fetch the answers to the poll of a project. 'silent': the errors aren't
// shown (when it is done automatically).
async function fetchAnswers(target, silent) {
    const {poll} = target;
    if (poll === null || poll.created === 0)
        return;
    try {
        await polls.fetchResponses(api, target);
        save();
        if (target === project)
            renderAll();
    } catch (error) {
        console.error(error);
        if (!silent && target === project)
            showPollError(error);
    }
}

function showPollError(error) {
    $("poll-error").textContent = t(client.errorKey(error));
    $("poll-error").hidden = false;
}

// Run an operation on the poll of the current project, from a button.
async function pollOperation(message, operation) {
    if (pollBusy)
        return;
    pollBusy = true;
    $("poll-error").hidden = true;
    $("poll-working").textContent = message;
    renderPoll();
    const target = project;
    try {
        await operation(target);
        save();
        if (target === project)
            renderAll();
    } catch (error) {
        console.error(error);
        showPollError(error);
    } finally {
        pollBusy = false;
        $("poll-working").textContent = "";
        renderPoll();
    }
}

function initPoll() {
    $("poll-message").addEventListener("input", (event) => {
        if (project.poll === null)
            return;
        project.poll.message = event.target.value;
        save();
    });
    $("poll-fetch").addEventListener("click", () =>
        pollOperation(t("poll.fetching"), async (p) => {
            // The poll may not be online yet.
            await polls.publishPoll(api, p);
            await polls.fetchResponses(api, p);
        }));
    $("poll-close").addEventListener("click", () =>
        pollOperation("", (p) => polls.setPollClosed(api, p, !p.poll.closed)));
    $("poll-reset").addEventListener("click", () => {
        if (confirm(t("poll.resetConfirm")))
            pollOperation("", (p) => polls.resetPoll(api, p));
    });
    $("poll-copy").addEventListener("click", (event) => copyText($("poll-link").value, event.target));
    $("poll-copy-all").addEventListener("click", (event) => {
        const lines = project.participants
            .map((p) => [p.name, polls.participantLink(location.href, project, p)])
            .filter(([, link]) => link !== null)
            .map(([name, link]) => `${name}: ${link}`);
        copyText(lines.join("\n"), event.target);
    });
    $("poll-link").addEventListener("focus", (event) => event.target.select());
}

// Copy 'text', and show it on 'button' for a moment.
async function copyText(text, button) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        // Without the clipboard API (e.g. not in a secure context).
        const area = document.createElement("textarea");
        area.value = text;
        document.body.append(area);
        area.select();
        document.execCommand("copy");
        area.remove();
    }
    const label = button.textContent;
    button.textContent = t("poll.copied");
    setTimeout(() => button.textContent = label, 2000);
}

function renderPoll() {
    const {poll} = project;
    // The example has no poll.
    $("poll-links").hidden = poll === null;
    const message = $("poll-message");
    if (document.activeElement !== message)
        message.value = poll === null? "": poll.message;
    if (poll !== null) {
        // The students added since the creation of the poll.
        if (polls.ensurePersonalLinks(project)) {
            save();
            renderParticipants();
        }
        $("poll-copy-all").hidden = !project.participants.some((p) => p.role !== "teacher");
        $("poll-link").value = polls.pollLink(location.href, poll.id, poll.key);
        $("poll-closed-note").hidden = !poll.closed;
        $("poll-close").textContent = t(poll.closed? "poll.reopen": "poll.close");
        renderPollSummary(poll.lastImport);
    }
    renderPollStatus();
    lockExample($("poll-links"));
    for (const element of $("poll-links").querySelectorAll("button"))
        if (pollBusy)
            element.disabled = true;
}

function renderPollStatus() {
    const status = $("poll-status");
    const {state, error} = pollStates.get(project.id) || {state: null, error: null};
    status.className = "sync-status";
    status.textContent = "";
    if (project.poll === null)
        return;
    // Up to date (e.g. after a reload).
    const current = (state === null && !polls.needsPublish(project))? "published": state;
    if (current === null)
        return;
    if (current === "offline" || current === "error")
        status.classList.add("problem");
    status.textContent = {
        "publishing": () => t("poll.publishing"),
        "published": () => t("poll.published"),
        "offline": () => t("poll.offline"),
        "error": () => t("poll.publishError", {error: t(client.errorKey(error))}),
    }[current]();
}

function renderPollSummary(summary) {
    const container = $("poll-summary");
    if (summary === null) {
        container.replaceChildren();
        return;
    }
    const title = document.createElement("p");
    title.textContent = t("poll.summary", {date: new Date(summary.date).toLocaleString(i18n.getLanguage())});
    const list = document.createElement("ul");
    const item = (text) => {
        const element = document.createElement("li");
        element.textContent = text;
        list.append(element);
    };
    if (summary.added.length > 0)
        item(t("poll.added", {names: summary.added.join(", ")}));
    if (summary.updated.length > 0)
        item(t("poll.updated", {names: summary.updated.join(", ")}));
    if (summary.unchanged > 0)
        item(t("poll.unchanged", {count: summary.unchanged}));
    if (summary.invalid > 0)
        item(t("poll.invalid", {count: summary.invalid}));
    if (list.children.length === 0)
        item(t("poll.noResponse"));
    container.replaceChildren(title, list);
}

/////////////////////////////////////////////////////////////////////////////
// Participants
/////////////////////////////////////////////////////////////////////////////

function initParticipants() {
    $("add-student").addEventListener("submit", (event) => {
        event.preventDefault();
        const name = $("add-student-name").value.trim();
        if (name === "")
            return;
        const duration = Number($("add-student-duration").value);
        const student = model.addStudent(project, name, duration);
        if (!(duration > 0))
            project.courses.pop();
        $("add-student-name").value = "";
        selectedParticipantId = student.id;
        changed(renderParticipants, renderAvailability, renderCourses);
        $("add-student-name").focus();
    });
}

function renderParticipants() {
    const rows = project.participants.map((participant) => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const name = document.createElement("input");
        name.type = "text";
        name.value = participant.name;
        name.setAttribute("aria-label", t("participants.name"));
        name.addEventListener("input", () => {
            participant.name = name.value;
            changed(renderAvailabilityParticipants, renderCourses, renderResult);
        });
        nameCell.append(name);
        if (participant.comment) {
            const comment = document.createElement("span");
            comment.className = "participant-comment";
            comment.textContent = t("poll.comment", {comment: participant.comment});
            nameCell.append(comment);
        }

        const roleCell = document.createElement("td");
        roleCell.textContent = t(participant.role === "teacher"? "role.teacher": "role.student");

        const countCell = document.createElement("td");
        const count = model.countAvailableSlots(project.calendar, participant);
        countCell.textContent = count;
        if (count === 0)
            countCell.className = "missing";

        // Their answer to the poll, at the last fetch.
        const responseCell = document.createElement("td");
        if (participant.role !== "teacher" && project.poll !== null) {
            responseCell.textContent = (participant.pollUpdated === undefined)? t("poll.notAnswered"):
                t("poll.answered", {date: new Date(participant.pollUpdated).toLocaleString(i18n.getLanguage())});
            if (participant.pollUpdated === undefined)
                responseCell.className = "note";
        }

        const actionsCell = document.createElement("td");
        actionsCell.className = "actions";
        const edit = button(t("participants.availability"), () => {
            if (participant.role === "teacher") {
                $("calendar-section").scrollIntoView({behavior: "smooth"});
                return;
            }
            selectedParticipantId = participant.id;
            renderAvailability();
            $("availability-section").scrollIntoView({behavior: "smooth"});
        });
        edit.classList.add("keep-enabled");
        actionsCell.append(edit);
        // Their personal link, once the poll is created (see 'renderPoll').
        if (polls.participantLink(location.href, project, participant) !== null) {
            // At the time of the click: with their current name.
            const copy = button(t("poll.copyLink"), (event) =>
                copyText(polls.participantLink(location.href, project, participant), event.target));
            copy.setAttribute("aria-label", `${t("poll.copyLink")} – ${participant.name}`);
            actionsCell.append(copy);
        }
        if (participant.role !== "teacher") {
            actionsCell.append(button(t("participants.delete"), () => {
                if (!confirm(t("participants.deleteConfirm", {name: participant.name})))
                    return;
                model.removeParticipant(project, participant.id);
                changed(renderParticipants, renderAvailability, renderCourses);
            }));
        }

        row.append(nameCell, roleCell, countCell, responseCell, actionsCell);
        return row;
    });
    $("participants-table").tBodies[0].replaceChildren(...rows);
    lockExample($("participants-section"));
}

function button(text, onClick) {
    const element = document.createElement("button");
    element.type = "button";
    element.textContent = text;
    element.addEventListener("click", onClick);
    return element;
}

/////////////////////////////////////////////////////////////////////////////
// Availability grid
/////////////////////////////////////////////////////////////////////////////

let selectedParticipantId = null;

// The participants (not the organizer, whose availabilities are in the
// section of the week).
function participantsOnly() {
    return project.participants.filter((p) => p.role !== "teacher");
}

function selectedParticipant() {
    const participants = participantsOnly();
    return participants.find((p) => p.id === selectedParticipantId) || participants[0] || null;
}

function initAvailability() {
    $("availability-participant").addEventListener("change", (event) => {
        selectedParticipantId = event.target.value;
        renderAvailabilityGrid();
    });
}

function renderAvailability() {
    renderAvailabilityParticipants();
    renderAvailabilityGrid();
}

function renderAvailabilityParticipants() {
    const participant = selectedParticipant();
    $("availability-participant").replaceChildren(...participantsOnly().map((p) =>
        new Option(p.name, p.id, false, p === participant)));
    $("availability-empty").hidden = participant !== null;
    $("availability-participant").closest("label").hidden = participant === null;
}

// The availabilities of a participant: only seen here, they give them with
// their link (see 'polls.js').
function renderAvailabilityGrid() {
    const participant = selectedParticipant();
    if (participant === null) {
        $("availability-grid").replaceChildren();
        return;
    }
    grid.renderGrid($("availability-grid"), {
        calendar: project.calendar,
        availability: participant.availability,
        disabled: true,
    });
}

/////////////////////////////////////////////////////////////////////////////
// Courses
/////////////////////////////////////////////////////////////////////////////

function initCourses() {
    $("add-course").addEventListener("click", () => {
        const teacher = model.teacherOf(project);
        project.courses.push(model.newCourse(
            storage.uniqueName(t("names.collectiveCourse"), project.courses.map((c) => c.name)),
            60, teacher === null? []: [teacher.id]));
        changed(renderCourses);
    });
}

function renderCourses() {
    const rows = project.courses.map((course) => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const name = document.createElement("input");
        name.type = "text";
        name.value = course.name;
        name.setAttribute("aria-label", t("courses.nameLabel"));
        name.addEventListener("input", () => {
            course.name = name.value;
            changed(renderResult);
        });
        nameCell.append(name);

        const durationCell = document.createElement("td");
        const duration = document.createElement("input");
        duration.type = "number";
        duration.min = "5";
        duration.step = "5";
        duration.value = course.duration;
        duration.className = "short";
        duration.setAttribute("aria-label", t("courses.durationLabel"));
        duration.addEventListener("input", () => {
            course.duration = Number(duration.value);
            changed();
        });
        durationCell.append(duration);

        const participantsCell = document.createElement("td");
        const details = document.createElement("details");
        details.className = "participants-picker";
        const summary = document.createElement("summary");
        const names = () => project.participants
            .filter((p) => course.participants.includes(p.id))
            .map((p) => p.name)
            .join(", ") || t("courses.none");
        summary.textContent = names();
        const list = document.createElement("div");
        for (const participant of project.participants) {
            const label = document.createElement("label");
            label.className = "inline";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = course.participants.includes(participant.id);
            checkbox.addEventListener("change", () => {
                course.participants = project.participants
                    .map((p) => p.id)
                    .filter((id) => id === participant.id? checkbox.checked: course.participants.includes(id));
                summary.textContent = names();
                changed();
            });
            label.append(checkbox, " " + participant.name);
            list.append(label);
        }
        details.append(summary, list);
        participantsCell.append(details);

        const actionsCell = document.createElement("td");
        actionsCell.className = "actions";
        actionsCell.append(button(t("courses.delete"), () => {
            project.courses = project.courses.filter((c) => c !== course);
            changed(renderCourses);
        }));

        row.append(nameCell, durationCell, participantsCell, actionsCell);
        return row;
    });
    $("courses-table").tBodies[0].replaceChildren(...rows);
    lockExample($("courses-section"));
}

/////////////////////////////////////////////////////////////////////////////
// Optimization
/////////////////////////////////////////////////////////////////////////////

function initSolve() {
    $("time-limit").addEventListener("input", (event) => {
        project.parameters.timeLimit = Number(event.target.value);
        save();
    });
    $("solve").addEventListener("click", solve);
    $("stop").addEventListener("click", () => {
        stopOptimization();
        $("solve-status").textContent = t("solve.stopped");
    });
}

function renderParameters() {
    $("time-limit").value = project.parameters.timeLimit;
}

function renderChecks() {
    const {errors, warnings} = model.check(project);
    const items = (messages) => messages.map((message) => {
        const item = document.createElement("li");
        item.textContent = message;
        return item;
    });
    $("check-errors").replaceChildren(...items(errors));
    $("check-warnings").replaceChildren(...items(warnings));
    $("solve").disabled = errors.length > 0 || worker !== null;
}

function solve() {
    if (worker !== null || model.check(project).errors.length > 0)
        return;
    // The project may be modified during the optimization: the timetable is
    // the one of the project when it started.
    const solved = structuredClone(project);
    const parameters = {};
    if (project.parameters.timeLimit > 0)
        parameters.timeLimit = project.parameters.timeLimit;
    worker = new Worker("timetablingsolver_worker.js");
    const started = performance.now();
    const timer = setInterval(() => {
        $("solve-status").textContent = t("solve.runningSeconds", {
            seconds: Math.round((performance.now() - started) / 1000)});
    }, 1000);
    $("solve-status").textContent = t("solve.running");
    $("stop").hidden = false;
    renderChecks();
    worker.onmessage = (event) => {
        const message = event.data;
        if (message.type === "ready")
            return;
        clearInterval(timer);
        stopOptimization();
        const target = projects.find((p) => p.id === solved.id);
        if (message.type === "error") {
            $("solve-status").textContent = t("solve.error", {error: message.error});
            return;
        }
        $("solve-status").textContent = "";
        if (target === undefined)
            return;
        target.result = model.toTimetable(solved, message.result);
        save();
        if (target === project) {
            renderResult();
            $("result-section").scrollIntoView({behavior: "smooth"});
        }
    };
    worker.onerror = (event) => {
        clearInterval(timer);
        stopOptimization();
        $("solve-status").textContent = t("solve.error", {error: event.message || t("solve.failed")});
    };
    worker.postMessage({type: "solve", instance: model.toInstance(solved), parameters});
    // Stopped by 'stopOptimization'.
    worker.timer = timer;
}

function stopOptimization() {
    if (worker === null)
        return;
    clearInterval(worker.timer);
    worker.terminate();
    worker = null;
    $("stop").hidden = true;
    $("solve-status").textContent = "";
    renderChecks();
}

/////////////////////////////////////////////////////////////////////////////
// Timetable
/////////////////////////////////////////////////////////////////////////////

// The publication of the timetable to the participants.
let publishing = false;

async function publishOperation(operation) {
    if (publishing)
        return;
    publishing = true;
    $("publish-error").hidden = true;
    $("publish-working").textContent = t("publish.working");
    renderPublication();
    const target = project;
    try {
        await operation(target);
        save();
    } catch (error) {
        console.error(error);
        $("publish-error").textContent = t(client.errorKey(error));
        $("publish-error").hidden = false;
    } finally {
        publishing = false;
        $("publish-working").textContent = "";
        renderPublication();
    }
}

function renderPublication() {
    const {poll, result} = project;
    $("publish-block").hidden = project.example === true || poll === null || result === null;
    if ($("publish-block").hidden)
        return;
    const outdated = result.signature !== model.signature(project);
    const published = poll.published;
    const changed = published !== null && published.signature !== polls.publicationSignature(project);
    const date = (published === null)? "": new Date(published.date).toLocaleString(i18n.getLanguage());
    const status = $("publish-status");
    status.className = "";
    if (outdated && (published === null || changed)) {
        status.textContent = t("publish.outdated");
        status.className = "warning-text";
    } else if (published === null) {
        status.textContent = t("publish.notPublished");
    } else if (changed) {
        status.textContent = t("publish.changed", {date});
        status.className = "warning-text";
    } else {
        status.textContent = t("publish.published", {date});
    }
    $("publish").textContent = t(published === null? "publish.publish": "publish.republish");
    $("publish").hidden = published !== null && !changed;
    $("publish").disabled = publishing || outdated;
    $("unpublish").hidden = published === null;
    $("unpublish").disabled = publishing;
}

function initResult() {
    $("publish").addEventListener("click", () => {
        if (confirm(t("publish.confirm")))
            publishOperation((p) => polls.publishTimetable(api, p));
    });
    $("unpublish").addEventListener("click", () => {
        if (confirm(t("publish.withdrawConfirm")))
            publishOperation((p) => polls.withdrawTimetable(api, p));
    });
    $("export-csv").addEventListener("click", () => {
        if (project.result !== null)
            download(project.name + ".csv", "﻿" + model.timetableCsv(project, project.result), "text/csv");
    });
    $("print").addEventListener("click", () => window.print());
}

function renderResultOutdated() {
    $("result-outdated").hidden = project.result === null
        || project.result.signature === model.signature(project);
    renderPublication();
}

// The preference of a participant for the slot of a scheduled course:
// "preferred", "possible" or "unavailable".
function preferenceOf(p) {
    return !p.available? "unavailable": p.score === model.SCORE_PREFERRED? "preferred": "possible";
}

const PREFERENCE_TITLES = {
    preferred: "result.preferredTitle",
    possible: "result.possibleTitle",
    unavailable: "result.unavailableTitle",
};

// A small dot with the preference of a participant.
function preferenceDot(preference) {
    const dot = document.createElement("i");
    dot.className = "dot " + preference;
    return dot;
}

function renderResult() {
    const timetable = project.result;
    $("result-section").hidden = timetable === null;
    renderPublication();
    if (timetable === null)
        return;
    renderResultOutdated();
    const courses = new Map(project.courses.map((c) => [c.id, c]));
    const participants = new Map(project.participants.map((p) => [p.id, p]));
    const participantName = (id) => participants.get(id)?.name ?? "?";
    const scheduled = timetable.courses.filter((c) => courses.has(c.courseId));

    // Messages: the courses not scheduled, the participants scheduled outside
    // their availabilities.
    const messages = [];
    for (const course of scheduled) {
        const name = courses.get(course.courseId).name;
        if (course.day === null) {
            messages.push(t("result.notScheduled", {name}));
            continue;
        }
        for (const p of course.participants.filter((p) => !p.available))
            messages.push(t("result.unavailable", {participant: participantName(p.participantId), course: name}));
    }
    $("result-messages").replaceChildren(...messages.map((message) => {
        const item = document.createElement("li");
        item.textContent = message;
        return item;
    }));

    renderTimetable(scheduled.filter((c) => c.day !== null), courses, participantName);

    const rows = [...scheduled].sort(model.compareScheduledCourses).map((course) => {
        const row = document.createElement("tr");
        const cells = [
            courses.get(course.courseId).name,
            course.day === null? t("result.unscheduled"): i18n.dayName(course.day),
            course.day === null? "": `${model.formatTime(course.start)} – ${model.formatTime(course.end)}`,
        ].map((text) => {
            const cell = document.createElement("td");
            cell.textContent = text;
            return cell;
        });
        const participantsCell = document.createElement("td");
        course.participants.forEach((p, i) => {
            if (i > 0)
                participantsCell.append(", ");
            const span = document.createElement("span");
            span.className = "participant";
            span.textContent = participantName(p.participantId);
            if (course.day !== null) {
                const preference = preferenceOf(p);
                span.prepend(preferenceDot(preference));
                span.title = t(PREFERENCE_TITLES[preference]);
                if (preference === "unavailable") {
                    span.classList.add("unavailable-participant");
                    span.append(" ⚠");
                }
            }
            participantsCell.append(span);
        });
        row.append(...cells, participantsCell);
        return row;
    });
    $("result-table").tBodies[0].replaceChildren(...rows);
}

// The week, with a column per day where the courses are placed. Courses at the
// same time (without common participant) are put side by side.
function renderTimetable(scheduled, courses, participantName) {
    const {calendar} = project;
    const days = model.usedDays(calendar);
    for (const course of scheduled)
        if (!days.includes(course.day))
            days.push(course.day);
    days.sort((a, b) => a - b);
    // From the hour of the first course to the hour after the last one.
    const weekHours = model.weekHours(calendar) || {start: 9 * 60, end: 20 * 60};
    const start = scheduled.length === 0? weekHours.start:
        Math.floor(Math.min(...scheduled.map((c) => c.start)) / 60) * 60;
    const end = scheduled.length === 0? weekHours.end:
        Math.ceil(Math.max(...scheduled.map((c) => c.end)) / 60) * 60;
    const pixels = (minutes) => (minutes / calendar.step) * TIMETABLE_SLOT_HEIGHT;
    const height = pixels(end - start);

    const week = document.createElement("div");
    week.className = "timetable";
    week.style.gridTemplateColumns = `auto repeat(${days.length}, minmax(7rem, 1fr))`;

    week.append(document.createElement("div"));
    for (const day of days) {
        const header = document.createElement("div");
        header.className = "day-header";
        header.textContent = i18n.dayName(day);
        week.append(header);
    }

    const hours = document.createElement("div");
    hours.className = "hours";
    hours.style.height = height + "px";
    for (let minute = Math.ceil(start / 60) * 60; minute <= end; minute += 60) {
        const label = document.createElement("div");
        label.textContent = model.formatTime(minute);
        label.style.top = pixels(minute - start) + "px";
        hours.append(label);
    }
    week.append(hours);

    for (const day of days) {
        const column = document.createElement("div");
        column.className = "day";
        column.style.height = height + "px";
        column.style.backgroundSize = `100% ${pixels(60)}px`;
        column.style.backgroundPositionY = pixels((60 - (start % 60)) % 60) + "px";
        const ofDay = scheduled.filter((c) => c.day === day).sort((a, b) => a.start - b.start);
        // Lanes: the first lane free at the start of each course.
        const laneEnds = [];
        const lanes = ofDay.map((course) => {
            let lane = laneEnds.findIndex((laneEnd) => laneEnd <= course.start);
            if (lane === -1) {
                lane = laneEnds.length;
                laneEnds.push(0);
            }
            laneEnds[lane] = course.end;
            return lane;
        });
        ofDay.forEach((course, i) => {
            const block = document.createElement("div");
            block.className = "course";
            if (course.participants.some((p) => !p.available))
                block.classList.add("has-unavailable");
            block.style.top = pixels(course.start - start) + "px";
            block.style.height = pixels(course.end - course.start) + "px";
            // Too short for two lines: the name and the start on one line.
            const short = pixels(course.end - course.start) < 32;
            if (short)
                block.classList.add("short");
            block.style.left = (100 * lanes[i] / laneEnds.length) + "%";
            block.style.width = (100 / laneEnds.length) + "%";
            const title = document.createElement("strong");
            title.textContent = courses.get(course.courseId).name;
            const time = document.createElement("span");
            const hours = `${model.formatTime(course.start)} – ${model.formatTime(course.end)}`;
            time.textContent = short? model.formatTime(course.start): hours;
            // A dot per participant (the organizer first), with their
            // preference for the slot.
            const dots = document.createElement("span");
            dots.className = "dots";
            dots.append(...course.participants.map((p) => preferenceDot(preferenceOf(p))));
            const line = document.createElement("span");
            line.className = "line";
            line.append(time, dots);
            block.append(title, line);
            block.title = `${courses.get(course.courseId).name}\n${hours}\n`
                + course.participants.map((p) =>
                    t("result.preference", {
                        participant: participantName(p.participantId),
                        preference: t(PREFERENCE_TITLES[preferenceOf(p)]),
                    })).join("\n");
            column.append(block);
        });
        week.append(column);
    }
    $("timetable").replaceChildren(week);
}

/////////////////////////////////////////////////////////////////////////////
// Page
/////////////////////////////////////////////////////////////////////////////

function initLanguage() {
    const select = $("language-select");
    select.replaceChildren(...Object.entries(i18n.LANGUAGES).map(([code, name]) =>
        new Option(name, code, false, code === i18n.getLanguage())));
    select.addEventListener("change", () => {
        i18n.setLanguage(select.value);
        storage.writePreference("language", select.value);
        translateExample();
        renderAll();
    });
}

function renderAll() {
    i18n.translateDocument();
    renderSync();
    $("language-flag").innerHTML = i18n.FLAGS[i18n.getLanguage()];
    renderProjectBar();
    renderCalendar();
    renderPoll();
    renderParticipants();
    renderAvailability();
    renderCourses();
    renderParameters();
    renderChecks();
    renderResult();
    lockExampleSections();
}

async function init() {
    i18n.setLanguage(i18n.detectLanguage(storage.readPreference("language"), navigator.languages || [navigator.language]));
    initLanguage();
    if (!store.persistent)
        showStorageWarning();
    loadProjects();
    initProjectBar();
    initCalendar();
    initPoll();
    initParticipants();
    initAvailability();
    initCourses();
    initSolve();
    initResult();
    initSync();
    save();
    renderAll();
    await openLinkOfPage();
    pullProject(project);
}

init();
