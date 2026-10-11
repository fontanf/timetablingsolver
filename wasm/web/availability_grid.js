// The availability grid: the slots of the week (a column per day), painted
// with a brush. Used by the page of the teacher and by the page of the
// students.

import {dayName, t} from "./i18n.js";
import * as model from "./model.js";

const SCORE_CLASSES = {[model.SCORE_PREFERRED]: "preferred", [model.SCORE_POSSIBLE]: "possible"};

// The brush of the radio buttons 'name': 0 (preferred), 1 (possible) or null
// (unavailable).
export function brush(name = "brush") {
    const value = document.querySelector(`input[name=${name}]:checked`).value;
    return value === "none"? null: Number(value);
}

function renderCell(cell, availability) {
    const score = availability[cell.dataset.key];
    cell.classList.remove("preferred", "possible");
    if (score !== undefined)
        cell.classList.add(SCORE_CLASSES[score] || "possible");
    let state = t(score === undefined? "availability.unavailable":
        score === model.SCORE_PREFERRED? "availability.preferred": "availability.possible");
    if (cell.classList.contains("teacher-off"))
        state += ", " + t("availability.teacherOff");
    cell.setAttribute("aria-label", t("availability.cellLabel", {
        day: cell.dataset.day, time: cell.dataset.time, state}));
}

function setScore(availability, key, score) {
    if (score === null)
        delete availability[key];
    else
        availability[key] = score;
}

// Paint on the grids rendered in 'container' (see 'renderGrid'): press on a
// cell, then move over the others.
// - 'availability()': the availability to paint ('"<day>:<minute>"' -> score),
//   or null if it can't be painted;
// - 'brush()': the score to paint, null for unavailable;
// - 'onChange()': called after each stroke.
export function attachPainting(container, {availability, brush, onChange}) {
    // The cells under the pointer are found with 'elementFromPoint', since a
    // touch pointer is captured by the element where it started.
    let painting = null;
    const paint = (cell) => {
        if (cell === null || cell.disabled || painting.done.has(cell.dataset.key))
            return;
        painting.done.add(cell.dataset.key);
        setScore(painting.availability, cell.dataset.key, painting.score);
        renderCell(cell, painting.availability);
    };
    container.addEventListener("pointerdown", (event) => {
        const cell = event.target.closest(".slot");
        const painted = availability();
        if (cell === null || painted === null || event.button !== 0)
            return;
        event.preventDefault();
        painting = {availability: painted, score: brush(), done: new Set()};
        paint(cell);
    });
    container.addEventListener("pointermove", (event) => {
        if (painting === null)
            return;
        const element = document.elementFromPoint(event.clientX, event.clientY);
        paint(element && element.closest(".slot"));
    });
    const stop = () => {
        if (painting === null)
            return;
        painting = null;
        onChange();
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    // Keyboard: Enter or Space on a cell ('detail' is 0 for the clicks which
    // don't come from a pointer).
    container.addEventListener("click", (event) => {
        const cell = event.target.closest(".slot");
        const painted = availability();
        if (cell === null || painted === null || event.detail !== 0)
            return;
        setScore(painted, cell.dataset.key, brush());
        renderCell(cell, painted);
        onChange();
    });
}

// Render the grid of 'availability' in 'container'.
// - 'teacherAvailability': if not null, the slots where the teacher isn't
//   available are hatched;
// - 'disabled': the cells can't be painted.
export function renderGrid(container, {calendar, availability, teacherAvailability = null, disabled = false}) {
    const days = model.usedDays(calendar);
    // The rows: from the start of the first time range of the week to the end
    // of the last one, and the start times of the slots of all the days. A
    // day has no cell (but an empty space) for the rows outside its ranges.
    const daySlots = new Map(days.map((day) => [day, new Set(model.slotTimes(calendar, day))]));
    const rowTimes = new Set(days.flatMap((day) => [...daySlots.get(day)]));
    const hours = model.weekHours(calendar);
    if (hours !== null)
        for (let time = hours.start; time + calendar.step <= hours.end; time += calendar.step)
            rowTimes.add(time);
    const times = [...rowTimes].sort((a, b) => a - b);

    const table = document.createElement("div");
    table.className = "availability";
    table.style.gridTemplateColumns = `auto repeat(${days.length}, minmax(var(--slot-width), 1fr))`;
    table.append(document.createElement("div"));
    for (const day of days) {
        // The short name on small screens.
        const header = document.createElement("div");
        header.className = "day-header";
        const long = document.createElement("span");
        long.className = "long";
        long.textContent = dayName(day);
        const short = document.createElement("span");
        short.className = "short";
        short.textContent = dayName(day, "short");
        header.append(long, short);
        table.append(header);
    }
    for (const minute of times) {
        const label = document.createElement("div");
        label.className = "time-label";
        if (minute % 60 === 0 || minute === times[0])
            label.textContent = model.formatTime(minute);
        table.append(label);
        for (const day of days) {
            if (!daySlots.get(day).has(minute)) {
                const empty = document.createElement("div");
                empty.className = "off-hours";
                table.append(empty);
                continue;
            }
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "slot";
            cell.disabled = disabled;
            if (minute % 60 === 0)
                cell.classList.add("hour");
            const key = model.slotKey(day, minute);
            cell.dataset.key = key;
            cell.dataset.day = dayName(day);
            cell.dataset.time = model.formatTime(minute);
            if (teacherAvailability !== null && teacherAvailability[key] === undefined)
                cell.classList.add("teacher-off");
            renderCell(cell, availability);
            table.append(cell);
        }
    }
    container.replaceChildren(table);
}
