// The page of a poll, for the students: they give their name and their
// availabilities, which are encrypted and sent to the server (see
// 'polls.js').
//
// With a personal link, the id and the token of the response, and the name
// of the student, are in the link: the student can modify their response from
// any device. With the shared link, they are generated when the response is
// first sent; the student then gets their personal link.
//
// The response is kept in the browser ('poll.<poll id>' for the shared link,
// 'poll.<poll id>.<response id>' for a personal link, in localStorage), with
// the drafts.

import * as grid from "./availability_grid.js";
import * as client from "./client.js";
import * as i18n from "./i18n.js";
import {formatTime} from "./model.js";
import {t} from "./i18n.js";
import * as polls from "./polls.js";
import * as storage from "./storage.js";

const $ = (id) => document.getElementById(id);

const api = new client.Api();

// '{pollId, key}' of the link, and '{responseId, token, name}' for a
// personal link.
let link = null;
// '{definition, closed}' of the poll.
let poll = null;
// The timetable published by the organizer for the participant (see
// 'readPublication' in 'polls.js'), or null.
let publication = null;
// The response of the student: '{name, availability, comment}', and
// '{responseId, token, sent}' once sent.
let response = {name: "", availability: {}, comment: ""};
let sending = false;

function isPersonal() {
    return link.responseId !== undefined;
}

function savedKey() {
    return "poll." + link.pollId + (isPersonal()? "." + link.responseId: "");
}

function loadSaved() {
    try {
        const saved = JSON.parse(storage.readPreference(savedKey()));
        if (saved !== null && typeof saved === "object") {
            response = {
                ...response,
                ...saved,
                availability: (saved.availability && typeof saved.availability === "object")? saved.availability: {},
            };
        }
    } catch (error) {
        // Nothing saved.
    }
}

// Also the drafts: the page can be reloaded before the response is sent.
function save() {
    storage.writePreference(savedKey(), JSON.stringify(response));
}

function fatal(message) {
    $("loading").hidden = true;
    $("response-form").hidden = true;
    $("fatal-error").textContent = message;
    $("fatal-error").hidden = false;
}

async function load() {
    link = polls.parsePollLink(location.hash);
    if (link === null) {
        fatal(t("student.invalidLink"));
        return;
    }
    loadSaved();
    if (isPersonal())
        response = {...response, name: link.name, responseId: link.responseId, token: link.token};
    try {
        poll = await polls.openPoll(api, link.pollId, link.key);
        // Sent from another device (or this browser forgot it).
        if (isPersonal() && response.sent === undefined) {
            const own = await polls.readOwnResponse(api, link.pollId, link.key, link);
            if (own !== null) {
                response = {...response, availability: own.availability, comment: own.comment, sent: own.updated};
                save();
            }
        }
    } catch (error) {
        console.error(error);
        // An error of the server, or a wrong key.
        fatal(t(error instanceof client.ApiError? client.errorKey(error): "student.invalidLink"));
        return;
    }
    $("loading").hidden = true;
    $("response-form").hidden = false;
    render();
    await loadPublication();
}

// The timetable published for the participant: with their personal link,
// or the one of their response sent with the shared link.
async function loadPublication() {
    const credentials = isPersonal()? link:
        (response.responseId !== undefined)? {responseId: response.responseId, token: response.token}:
        null;
    if (credentials === null)
        return;
    try {
        publication = await polls.readPublication(api, link.pollId, link.key, credentials);
    } catch (error) {
        // Not shown: the availabilities can still be given.
        console.error(error);
        publication = null;
    }
    renderPublication();
}

function renderPublication() {
    $("my-timetable").hidden = publication === null;
    if (publication === null)
        return;
    const items = [
        ...publication.courses.map((course) => t("student.timetableCourse", {
            day: i18n.dayName(course.day),
            start: formatTime(course.start),
            end: formatTime(course.end),
            name: course.name,
        })),
        ...publication.unscheduled.map((name) => t("student.timetableUnscheduled", {name})),
    ];
    if (items.length === 0)
        items.push(t("student.timetableNone"));
    $("my-timetable-courses").replaceChildren(...items.map((text) => {
        const item = document.createElement("li");
        item.textContent = text;
        return item;
    }));
    $("my-timetable-date").textContent = t("student.timetablePublished", {
        date: new Date(publication.published).toLocaleString(i18n.getLanguage())});
}

function render() {
    i18n.translateDocument();
    $("language-flag").innerHTML = i18n.FLAGS[i18n.getLanguage()];
    if (poll === null)
        return;
    const {definition, closed} = poll;
    // With a personal link, the name is in the link: shown, not modified.
    const name = isPersonal()? response.name.trim(): "";
    $("intro").textContent =
        (name !== "" && definition.title)? t("student.introNamedTitle", {name, title: definition.title}):
        name !== ""? t("student.introNamed", {name}):
        definition.title? t("student.introTitle", {title: definition.title}):
        t("student.intro");
    $("student-name").closest("label").hidden = isPersonal();
    $("teacher-message").textContent = definition.message || "";
    $("teacher-message").hidden = !definition.message;
    $("closed").hidden = !closed;
    $("student-name").value = response.name;
    $("student-comment").value = response.comment;
    // The personal link can still be copied.
    for (const element of $("response-form").querySelectorAll("input, textarea, button"))
        element.disabled = (closed || sending) && !element.closest("#own-link");
    renderGrid();
    renderSent();
    renderPublication();
}

function renderGrid() {
    grid.renderGrid($("student-grid"), {
        calendar: poll.definition.calendar,
        availability: response.availability,
        teacherAvailability: poll.definition.teacherAvailability,
        disabled: poll.closed || sending,
    });
}

function renderSent() {
    $("sent").hidden = response.sent === undefined;
    if (response.sent === undefined)
        return;
    $("sent-text").textContent = t(isPersonal()? "student.sent": "student.sentShort",
        {date: new Date(response.sent).toLocaleString(i18n.getLanguage())});
    // With the shared link: the personal link of the student.
    $("own-link").hidden = isPersonal();
    if (!isPersonal()) {
        $("own-link-input").value = polls.personalLink(
            location.href, link.pollId, link.key, response, response.name.trim());
    }
}

async function send(event) {
    event.preventDefault();
    if (sending || poll.closed)
        return;
    const error = (message) => {
        $("send-error").textContent = message;
        $("send-error").hidden = false;
    };
    $("send-error").hidden = true;
    if (response.name.trim() === "") {
        error(t("student.nameRequired"));
        $("student-name").focus();
        return;
    }
    if (Object.keys(response.availability).length === 0) {
        error(t("student.noSlot"));
        return;
    }
    sending = true;
    $("send-status").textContent = t("student.sending");
    render();
    try {
        const saved = (response.responseId === undefined)? null: {responseId: response.responseId, token: response.token};
        const {responseId, token} = await polls.sendResponse(api, link.pollId, link.key, saved, response);
        response = {...response, responseId, token, sent: Date.now()};
        save();
    } catch (sendError) {
        console.error(sendError);
        if (sendError instanceof client.ApiError && sendError.code === "closed")
            poll.closed = true;
        error(t(client.errorKey(sendError)));
    } finally {
        sending = false;
        $("send-status").textContent = "";
        render();
    }
}

function init() {
    i18n.setLanguage(i18n.detectLanguage(
        storage.readPreference("language"), navigator.languages || [navigator.language]));
    const select = $("language-select");
    select.replaceChildren(...Object.entries(i18n.LANGUAGES).map(([code, name]) =>
        new Option(name, code, false, code === i18n.getLanguage())));
    select.addEventListener("change", () => {
        i18n.setLanguage(select.value);
        storage.writePreference("language", select.value);
        render();
    });

    $("student-name").addEventListener("input", (event) => {
        response.name = event.target.value;
        save();
    });
    $("student-comment").addEventListener("input", (event) => {
        response.comment = event.target.value;
        save();
    });
    grid.attachPainting($("student-grid"), {
        availability: () => (poll === null || poll.closed || sending)? null: response.availability,
        brush: () => grid.brush(),
        onChange: save,
    });
    $("response-form").addEventListener("submit", send);
    $("own-link-copy").addEventListener("click", async (event) => {
        try {
            await navigator.clipboard.writeText($("own-link-input").value);
        } catch (error) {
            $("own-link-input").select();
            document.execCommand("copy");
        }
        event.target.textContent = t("poll.copied");
        setTimeout(() => event.target.textContent = t("poll.copy"), 2000);
    });
    $("own-link-input").addEventListener("focus", (event) => event.target.select());
    // Another link opened in the same tab.
    window.addEventListener("hashchange", () => location.reload());

    render();
    load();
}

init();
