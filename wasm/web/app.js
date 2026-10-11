// The web page: the projects of the teacher, their forms, the availability
// grid, the optimization (in a Web Worker) and the timetable.

import * as grid from "./availability_grid.js";
import * as i18n from "./i18n.js";
import {t} from "./i18n.js";
import * as model from "./model.js";
import * as polls from "./polls.js";
import * as storage from "./storage.js";

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

function save() {
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
        // The poll stays with the original project.
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
            polls.deletePoll(pollApi, project).catch((error) => console.error(error));
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
    "calendar-section", "poll-section", "participants-section", "availability-section", "courses-section",
    "solve-section"];

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

// The choices of the days of a new range: a day, or several.
function rangeDayChoices() {
    return [
        ...[0, 1, 2, 3, 4, 5, 6].map((day) => ({value: String(day), label: i18n.dayName(day), days: [day]})),
        {value: "weekdays", label: t("calendar.weekdays"), days: [0, 1, 2, 3, 4]},
        {value: "every-day", label: t("calendar.everyDay"), days: [0, 1, 2, 3, 4, 5, 6]},
    ];
}

function initCalendar() {
    $("calendar-step").addEventListener("change", (event) => {
        project.calendar.step = Number(event.target.value);
        changed(renderAvailabilityGrid, renderParticipants);
    });
    $("add-range").addEventListener("submit", (event) => {
        event.preventDefault();
        const choice = rangeDayChoices().find((c) => c.value === $("add-range-day").value);
        const start = model.parseTime($("add-range-start").value);
        const end = model.parseTime($("add-range-end").value);
        const error = (choice === undefined || Number.isNaN(start) || Number.isNaN(end))?
            {key: "calendar.invalidRange", parameters: {}}:
            model.addRange(project.calendar, choice.days, start, end);
        $("add-range-error").hidden = error === null;
        if (error !== null) {
            $("add-range-error").textContent = t(error.key, error.parameters);
            return;
        }
        changed(renderCalendar, renderAvailabilityGrid, renderParticipants);
    });
    // The error is about the previous values.
    for (const id of ["add-range-day", "add-range-start", "add-range-end"])
        $(id).addEventListener("input", () => $("add-range-error").hidden = true);
}

function renderCalendar() {
    const {calendar} = project;
    // About the previous values, or in the previous language.
    $("add-range-error").hidden = true;
    $("calendar-step").replaceChildren(...model.STEPS.map((step) =>
        new Option(t("calendar.minutes", {minutes: step}), step, false, step === calendar.step)));
    const daySelect = $("add-range-day");
    const selected = daySelect.value;
    daySelect.replaceChildren(...rangeDayChoices().map((choice) =>
        new Option(choice.label, choice.value, false, choice.value === selected)));

    // A row per day with time ranges.
    const days = model.usedDays(calendar);
    $("calendar-empty").hidden = days.length > 0;
    const rows = days.map((day) => {
        const row = document.createElement("tr");
        const dayCell = document.createElement("th");
        dayCell.scope = "row";
        dayCell.textContent = i18n.dayName(day);
        const rangesCell = document.createElement("td");
        const ranges = document.createElement("div");
        ranges.className = "ranges";
        for (const range of calendar.days[day].ranges) {
            const chip = document.createElement("span");
            chip.className = "chip";
            const remove = button("×", () => {
                model.removeRange(calendar, day, range);
                changed(renderCalendar, renderAvailabilityGrid, renderParticipants);
            });
            const removeLabel = t("calendar.removeRange", {range: model.formatRange(range)});
            remove.setAttribute("aria-label", `${i18n.dayName(day)} – ${removeLabel}`);
            remove.title = removeLabel;
            chip.append(model.formatRange(range), remove);
            ranges.append(chip);
        }
        rangesCell.append(ranges);
        row.append(dayCell, rangesCell);
        return row;
    });
    $("calendar-table").tBodies[0].replaceChildren(...rows);
    lockExample($("calendar-section"));
}

/////////////////////////////////////////////////////////////////////////////
// Poll
/////////////////////////////////////////////////////////////////////////////

const pollApi = new polls.PollApi();

// 'true' during a request to the server.
let pollBusy = false;

// Run an operation on the poll of the current project.
async function pollOperation(operation) {
    if (pollBusy)
        return;
    pollBusy = true;
    $("poll-error").hidden = true;
    $("poll-status").textContent = t("poll.working");
    renderPoll();
    const target = project;
    try {
        await operation(target);
        save();
        if (target === project)
            renderAll();
    } catch (error) {
        console.error(error);
        $("poll-error").textContent = t(polls.errorKey(error));
        $("poll-error").hidden = false;
    } finally {
        pollBusy = false;
        $("poll-status").textContent = "";
        renderPoll();
    }
}

function initPoll() {
    $("poll-create-button").addEventListener("click", () =>
        pollOperation((p) => polls.createPoll(pollApi, p, $("poll-message").value.trim())));
    $("poll-update").addEventListener("click", () => pollOperation((p) => polls.updatePoll(pollApi, p)));
    $("poll-fetch").addEventListener("click", () => pollOperation((p) => polls.fetchResponses(pollApi, p)));
    $("poll-close").addEventListener("click", () =>
        pollOperation((p) => polls.setPollClosed(pollApi, p, !p.poll.closed)));
    $("poll-delete").addEventListener("click", () => {
        if (confirm(t("poll.deleteConfirm")))
            pollOperation((p) => polls.deletePoll(pollApi, p));
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
    $("poll-create").hidden = poll !== null;
    $("poll-active").hidden = poll === null;
    if (poll !== null) {
        // The students added since the creation of the poll.
        if (polls.ensurePersonalLinks(project))
            save();
        renderPollStudents();
        $("poll-link").value = polls.pollLink(location.href, poll.id, poll.key);
        $("poll-outdated").hidden = !polls.isPollOutdated(project);
        $("poll-closed-note").hidden = !poll.closed;
        $("poll-close").textContent = t(poll.closed? "poll.reopen": "poll.close");
        renderPollSummary(poll.lastImport);
    }
    lockExample($("poll-section"));
    for (const element of $("poll-section").querySelectorAll("button, textarea"))
        if (pollBusy)
            element.disabled = true;
}

// The students, their personal links, and whether they answered.
function renderPollStudents() {
    const students = project.participants.filter((p) => p.role !== "teacher");
    $("poll-no-student").hidden = students.length > 0;
    $("poll-students").hidden = students.length === 0;
    $("poll-copy-all").hidden = students.length === 0;
    const rows = students.map((student) => {
        const row = document.createElement("tr");
        const name = document.createElement("td");
        name.textContent = student.name;
        const status = document.createElement("td");
        status.textContent = (student.pollUpdated === undefined)? t("poll.notAnswered"):
            t("poll.answered", {date: new Date(student.pollUpdated).toLocaleString(i18n.getLanguage())});
        if (student.pollUpdated === undefined)
            status.className = "note";
        const actions = document.createElement("td");
        actions.className = "actions";
        const copy = button(t("poll.copyLink"), (event) =>
            copyText(polls.participantLink(location.href, project, student), event.target));
        copy.setAttribute("aria-label", `${t("poll.copyLink")} – ${student.name}`);
        actions.append(copy);
        row.append(name, status, actions);
        return row;
    });
    $("poll-students").tBodies[0].replaceChildren(...rows);
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

        const actionsCell = document.createElement("td");
        actionsCell.className = "actions";
        const edit = button(t("participants.availability"), () => {
            selectedParticipantId = participant.id;
            renderAvailability();
            $("availability-section").scrollIntoView({behavior: "smooth"});
        });
        edit.classList.add("keep-enabled");
        actionsCell.append(edit);
        if (participant.role !== "teacher") {
            actionsCell.append(button(t("participants.delete"), () => {
                if (!confirm(t("participants.deleteConfirm", {name: participant.name})))
                    return;
                model.removeParticipant(project, participant.id);
                changed(renderParticipants, renderAvailability, renderCourses);
            }));
        }

        row.append(nameCell, roleCell, countCell, actionsCell);
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

function selectedParticipant() {
    return project.participants.find((p) => p.id === selectedParticipantId)
        || project.participants[0]
        || null;
}

function initAvailability() {
    $("availability-participant").addEventListener("change", (event) => {
        selectedParticipantId = event.target.value;
        renderAvailabilityGrid();
    });
    $("availability-clear").addEventListener("click", () => {
        const participant = selectedParticipant();
        if (participant === null || !confirm(t("availability.clearConfirm", {name: participant.name})))
            return;
        participant.availability = {};
        changed(renderAvailabilityGrid, renderParticipants);
    });
    grid.attachPainting($("availability-grid"), {
        availability: () => {
            const participant = selectedParticipant();
            return (project.example || participant === null)? null: participant.availability;
        },
        brush: () => grid.brush(),
        onChange: () => changed(renderParticipants),
    });
}

function renderAvailability() {
    renderAvailabilityParticipants();
    renderAvailabilityGrid();
}

function renderAvailabilityParticipants() {
    const participant = selectedParticipant();
    $("availability-participant").replaceChildren(...project.participants.map((p) =>
        new Option(p.role === "teacher"? t("availability.teacherSuffix", {name: p.name}): p.name,
            p.id, false, p === participant)));
}

function renderAvailabilityGrid() {
    const participant = selectedParticipant();
    if (participant === null) {
        $("availability-grid").replaceChildren();
        return;
    }
    // For the students, the slots where the teacher isn't available.
    const teacher = model.teacherOf(project);
    grid.renderGrid($("availability-grid"), {
        calendar: project.calendar,
        availability: participant.availability,
        teacherAvailability: (teacher !== null && teacher !== participant)? teacher.availability: null,
    });
    lockExample($("availability-section"));
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
    $("default-score").addEventListener("input", (event) => {
        project.parameters.defaultScore = Number(event.target.value);
        changed();
    });
    $("solve").addEventListener("click", solve);
    $("stop").addEventListener("click", () => {
        stopOptimization();
        $("solve-status").textContent = t("solve.stopped");
    });
}

function renderParameters() {
    $("time-limit").value = project.parameters.timeLimit;
    $("default-score").value = project.parameters.defaultScore;
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

function initResult() {
    $("export-csv").addEventListener("click", () => {
        if (project.result !== null)
            download(project.name + ".csv", "﻿" + model.timetableCsv(project, project.result), "text/csv");
    });
    $("print").addEventListener("click", () => window.print());
}

function renderResultOutdated() {
    $("result-outdated").hidden = project.result === null
        || project.result.signature === model.signature(project);
}

function renderResult() {
    const timetable = project.result;
    $("result-section").hidden = timetable === null;
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
            span.textContent = participantName(p.participantId);
            if (course.day !== null && !p.available) {
                span.className = "unavailable-participant";
                span.title = t("result.unavailableTitle");
                span.textContent += " ⚠";
            } else if (course.day !== null && p.score === model.SCORE_POSSIBLE) {
                span.title = t("result.possibleTitle");
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
            block.style.left = (100 * lanes[i] / laneEnds.length) + "%";
            block.style.width = (100 / laneEnds.length) + "%";
            const title = document.createElement("strong");
            title.textContent = courses.get(course.courseId).name;
            const time = document.createElement("span");
            time.textContent = `${model.formatTime(course.start)} – ${model.formatTime(course.end)}`;
            block.append(title, time);
            block.title = `${courses.get(course.courseId).name}\n${time.textContent}\n`
                + course.participants.map((p) => participantName(p.participantId)).join(", ");
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

function init() {
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
    save();
    renderAll();
}

init();
