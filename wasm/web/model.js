// Model of the web page: the projects of the teachers, their conversion into
// instances of the solver, and the conversion of the results of the solver
// into timetables. No DOM here: the functions are tested with Node.
//
// A project:
//
//     {
//         id, name, created,
//         calendar: {
//             step: 15,               // in minutes
//             // The 7 days of the week, 0: Monday, ..., 6: Sunday, with
//             // their time ranges, in minutes since midnight, sorted and
//             // disjoint (see 'setWeekSelection'). The days without
//             // range aren't used.
//             days: [{ranges: [{start: 540, end: 720}, ...]}, ...],
//         },
//         participants: [{
//             id, name,
//             role: "teacher" | "student",
//             // '"<day>:<minute>"' -> score (0: preferred, 1: possible);
//             // the slots not listed are unavailable.
//             availability: {"0:540": 0, ...},
//             // About the poll (see 'polls.js'):
//             pollLink, pollResponseIds, pollUpdated, comment,
//         }],
//         courses: [{
//             id, name,
//             duration,          // in minutes
//             participants: [participantId, ...],
//         }],
//         parameters: {
//             timeLimit,         // in seconds
//         },
//         result: null | timetable (see 'toTimetable'),
//         poll: null | poll (see 'polls.js'),
//         sync: null | sync (see 'sync.js'),
//     }
//
// The time ranges of the calendar are put one after the other on the time
// line of the solver, separated by a time step where no one is available, so
// that no course spans two ranges (or two days).
//
// The names given to the new participants and courses are in the language of
// the page when they are created ('t').

import {dayName, t} from "./i18n.js";

export const SCORE_PREFERRED = 0;
export const SCORE_POSSIBLE = 1;
// The score of an unavailable slot: the solver uses one only if there is no
// other way to schedule the courses.
export const UNAVAILABLE_SCORE = 10;

export const STEPS = [5, 10, 15, 20, 30, 60];

export function newId() {
    return (typeof crypto !== "undefined" && crypto.randomUUID !== undefined)?
        crypto.randomUUID():
        Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const NUMBER_OF_DAYS = 7;

export function defaultCalendar() {
    const days = [];
    for (let day = 0; day < NUMBER_OF_DAYS; ++day)
        days.push({ranges: day < 5? [{start: 9 * 60, end: 20 * 60}]: []});
    return {step: 15, days};
}

// A calendar of a stored or imported project, in the current format. The
// first versions had the same hours for all the days:
// '{days: [0, 1, ...], start, end, step}'.
export function normalizeCalendar(calendar) {
    const result = defaultCalendar();
    if (calendar === null || typeof calendar !== "object")
        return result;
    if (STEPS.includes(calendar.step))
        result.step = calendar.step;
    const isTime = (value) => Number.isInteger(value) && value >= 0 && value <= 24 * 60;
    const ranges = (list) => (Array.isArray(list)? list: [])
        .filter((r) => r !== null && typeof r === "object" && isTime(r.start) && isTime(r.end) && r.start < r.end)
        .map((r) => ({start: r.start, end: r.end}))
        .sort((a, b) => a.start - b.start);
    const days = Array.isArray(calendar.days)? calendar.days: [];
    if (days.every((day) => typeof day === "number")) {
        const range = ranges([calendar]);
        for (let day = 0; day < NUMBER_OF_DAYS; ++day)
            result.days[day].ranges = days.includes(day)? range: [];
        return result;
    }
    for (let day = 0; day < NUMBER_OF_DAYS; ++day) {
        const d = (days[day] !== null && typeof days[day] === "object")? days[day]: {};
        // Development versions had a flag 'enabled', and a single range per
        // day: '{enabled, start, end}'.
        result.days[day].ranges = (d.enabled === false)? []: ranges(Array.isArray(d.ranges)? d.ranges: [d]);
    }
    return result;
}

// The hours shown to paint the availabilities of the organizer: from 07:00 to
// 21:00, and the time ranges outside, aligned on the step.
export function weekGridHours(calendar) {
    const ranges = calendar.days.flatMap((d) => d.ranges);
    const step = calendar.step;
    const start = Math.min(7 * 60, ...ranges.map((r) => r.start));
    const end = Math.max(21 * 60, ...ranges.map((r) => r.end));
    return {start: Math.floor(start / step) * step, end: Math.min(24 * 60, Math.ceil(end / step) * step)};
}

// The time ranges of the days 'days' from painted slots ('"<day>:<minute>"'
// -> score): the consecutive slots of a day form a time range.
export function setWeekSelection(calendar, selection, days = [0, 1, 2, 3, 4, 5, 6]) {
    const minutes = calendar.days.map(() => []);
    for (const key of Object.keys(selection)) {
        const {day, minute} = parseSlotKey(key);
        minutes[day].push(minute);
    }
    calendar.days.forEach((d, day) => {
        if (!days.includes(day))
            return;
        d.ranges = [];
        for (const minute of minutes[day].sort((a, b) => a - b)) {
            const last = d.ranges.at(-1);
            if (last !== undefined && last.end === minute)
                last.end = minute + calendar.step;
            else
                d.ranges.push({start: minute, end: minute + calendar.step});
        }
    });
}

// The availabilities of the organizer define the week: the courses can take
// place when they are available. Set them, and the time ranges of the days
// 'days' (the other days keep their ranges, e.g. not aligned on the step).
export function setOrganizerAvailability(project, availability, days = [0, 1, 2, 3, 4, 5, 6]) {
    teacherOf(project).availability = availability;
    setWeekSelection(project.calendar, availability, days);
}

// Make the week and the availabilities of the organizer the same: the slots
// of the week where the organizer is available (for the projects of the
// first versions, where they were set separately, or after a change of the
// step). If the organizer gave no availability, they are available on the
// whole week.
export function alignCalendar(project) {
    const organizer = teacherOf(project);
    if (organizer === null)
        return;
    const {calendar} = project;
    const slots = usedDays(calendar).flatMap((day) => slotTimes(calendar, day).map((minute) => slotKey(day, minute)));
    let availability = {};
    for (const key of slots)
        if (organizer.availability[key] !== undefined)
            availability[key] = organizer.availability[key];
    if (Object.keys(availability).length === 0)
        availability = Object.fromEntries(slots.map((key) => [key, SCORE_PREFERRED]));
    setOrganizerAvailability(project, availability);
}

export function defaultParameters() {
    return {timeLimit: 30};
}

export function newParticipant(name, role = "student") {
    return {id: newId(), name, role, availability: {}};
}

export function newCourse(name, duration, participants) {
    return {id: newId(), name, duration, participants: [...participants]};
}

export function newProject(name) {
    const teacher = newParticipant(t("names.teacher"), "teacher");
    const project = {
        id: newId(),
        name,
        created: Date.now(),
        calendar: defaultCalendar(),
        participants: [teacher],
        courses: [],
        parameters: defaultParameters(),
        result: null,
        // See 'polls.js'.
        poll: null,
        // See 'sync.js'.
        sync: null,
    };
    // The organizer is available on the default week.
    alignCalendar(project);
    return project;
}

// The teacher of a project: the first participant with the role "teacher".
export function teacherOf(project) {
    return project.participants.find((p) => p.role === "teacher") || null;
}

// Add a student and their individual course.
export function addStudent(project, name, duration = 30) {
    const student = newParticipant(name);
    project.participants.push(student);
    const teacher = teacherOf(project);
    project.courses.push(newCourse(
        t("names.individualCourse", {name}), duration,
        teacher === null? [student.id]: [teacher.id, student.id]));
    return student;
}

// Remove a participant, from their courses too. Their courses left without a
// student (e.g. their individual course) are removed.
export function removeParticipant(project, participantId) {
    project.participants = project.participants.filter((p) => p.id !== participantId);
    const students = new Set(project.participants.filter((p) => p.role !== "teacher").map((p) => p.id));
    project.courses = project.courses.filter((course) => {
        if (!course.participants.includes(participantId))
            return true;
        course.participants = course.participants.filter((id) => id !== participantId);
        return course.participants.some((id) => students.has(id));
    });
}

export const EXAMPLE_ID = "example";

// The participants of the example: a man and a woman for each letter.
const EXAMPLE_NAMES = [
    "Adam", "Alice", "Bruno", "Béatrice", "Charles", "Chloé", "David", "Diane", "Ethan", "Emma",
    "Félix", "Fanny", "Gabriel", "Gabrielle", "Hugo", "Hélène", "Ivan", "Inès", "Jules", "Julie",
    "Kevin", "Katia", "Louis", "Léa", "Marc", "Manon", "Nathan", "Nina", "Oscar", "Olivia",
    "Paul", "Pauline", "Quentin", "Quitterie", "Raphaël", "Rose", "Samuel", "Sarah", "Thomas", "Tania",
    "Ugo", "Ursula", "Victor", "Victoire", "William", "Wendy", "Xavier", "Xénia", "Yann", "Yasmine",
    "Zacharie", "Zoé",
];

// The levels of the example: the duration of the individual courses, the slot
// of the group course (day, start; it lasts an hour), and the profiles of the
// participants (see 'EXAMPLE_PROFILES'), the beginners being mostly children.
const EXAMPLE_LEVELS = [
    {duration: 15, group: [2, 14 * 60], profiles: "ccccccccccctt"},
    {duration: 30, group: [2, 16 * 60], profiles: "cccccctttttaa"},
    {duration: 45, group: [5, 11 * 60], profiles: "tttttaaaauurr"},
    {duration: 60, group: [1, 19 * 60], profiles: "aaaaarrrruutt"},
];

// The availabilities of the profiles of the participants of the example:
// '(random) => [[day, start, end, score], ...]' (0: Monday, ...).
const H = 60;
const EXAMPLE_PROFILES = {
    // Children: Wednesday afternoon, some days after school, sometimes
    // Saturday morning.
    c: (random) => [
        [2, 13 * H + 30 * random(2), 17 * H + 60 * random(2), SCORE_PREFERRED],
        ...random.days([0, 1, 3, 4], 1 + random(2)).map((day) =>
            [day, 16 * H + 45 + 15 * random(2), 18 * H + 30 * random(2), SCORE_POSSIBLE]),
        ...(random(2) === 0? [[5, 9 * H + 30, 12 * H, SCORE_PREFERRED]]: []),
    ],
    // Teenagers: Wednesday afternoon, some evenings, sometimes Saturday
    // morning.
    t: (random) => [
        [2, 14 * H + 30 * random(2), 18 * H + 30 * random(2), SCORE_PREFERRED],
        ...random.days([0, 1, 3, 4], 2 + random(2)).map((day) =>
            [day, 17 * H + 30 + 30 * random(2), 20 * H, SCORE_POSSIBLE]),
        ...(random(2) === 0? [[5, 10 * H, 13 * H, SCORE_POSSIBLE]]: []),
    ],
    // Working adults: some evenings, Saturday morning or afternoon,
    // sometimes at lunch time.
    a: (random) => [
        ...random.days([0, 1, 2, 3, 4], 2 + random(2)).map((day) =>
            [day, 18 * H + 30 * random(2), 20 * H, SCORE_PREFERRED]),
        random(2) === 0? [5, 9 * H, 13 * H, SCORE_POSSIBLE]: [5, 14 * H, 17 * H, SCORE_POSSIBLE],
        ...(random(3) === 0? [[random.days([0, 1, 3, 4], 1)[0], 13 * H, 14 * H, SCORE_POSSIBLE]]: []),
    ],
    // University students: afternoons, depending on their schedule.
    u: (random) => random.days([0, 1, 2, 3, 4], 3).map((day, i) => {
        const start = 13 * H + 60 * random(4);
        return [day, start, start + 2 * H + 30 * random(3), i === 0? SCORE_PREFERRED: SCORE_POSSIBLE];
    }),
    // Retirees: early afternoons, sometimes Wednesday morning.
    r: (random) => [
        ...random.days([0, 1, 3, 4], 3).map((day) =>
            [day, 13 * H + 30 * random(3), 16 * H + 30 * random(2), SCORE_PREFERRED]),
        ...(random(2) === 0? [[2, 9 * H + 30, 11 * H + 30, SCORE_POSSIBLE]]: []),
    ],
};

// The example: 52 participants in 4 levels, each with an individual course
// (15, 30, 45 or 60 minutes depending on their level) and the group course of
// their level. The availabilities of the participants depend on their profile
// (children, teenagers, adults...), with pseudo-random variations, the same
// each time. It isn't stored, can't be modified, and is in the language of the
// page when it is created.
export function exampleProject() {
    const project = newProject(t("project.example"));
    project.id = EXAMPLE_ID;
    project.example = true;
    project.created = 0;
    const organizer = teacherOf(project);
    const {step} = project.calendar;

    // The organizer (and so the week): the weekdays from 13:00 to 20:00,
    // Wednesday morning (possible), and Saturday from 09:00 to 13:00, and
    // from 14:00 to 18:00 (possible).
    organizer.availability = {};
    for (const day of [0, 1, 2, 3, 4])
        setAvailability(organizer, day, 13 * H, 20 * H, SCORE_PREFERRED, step);
    setAvailability(organizer, 2, 9 * H, 12 * H, SCORE_POSSIBLE, step);
    setAvailability(organizer, 5, 9 * H, 13 * H, SCORE_PREFERRED, step);
    setAvailability(organizer, 5, 14 * H, 18 * H, SCORE_POSSIBLE, step);
    setOrganizerAvailability(project, organizer.availability);

    // A pseudo-random generator (linear congruential), always with the same
    // seed: 'random(n)' in [0, n), 'random.days(days, n)': n of the days.
    let seed = 20261014;
    const random = (n) => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return Math.floor(seed / 65536) % n;
    };
    random.days = (days, n) => {
        const left = [...days];
        const chosen = [];
        while (chosen.length < n && left.length > 0)
            chosen.push(left.splice(random(left.length), 1)[0]);
        return chosen.sort((a, b) => a - b);
    };

    const groups = EXAMPLE_LEVELS.map(() => []);
    EXAMPLE_NAMES.forEach((name, i) => {
        const level = i % EXAMPLE_LEVELS.length;
        const {duration, group, profiles} = EXAMPLE_LEVELS[level];
        const participant = addStudent(project, name, duration);
        const profile = EXAMPLE_PROFILES[profiles[groups[level].length]];
        groups[level].push(participant);
        for (const [day, start, end, score] of profile(random))
            setAvailability(participant, day, start, end, score, step);
        // They registered for the group course of their level.
        setAvailability(participant, group[0], group[1], group[1] + H, SCORE_PREFERRED, step);
    });
    groups.forEach((participants, level) => {
        project.courses.push(newCourse(
            t("names.levelGroupCourse", {level: level + 1}), 60,
            [organizer.id, ...participants.map((p) => p.id)]));
    });
    return project;
}

/////////////////////////////////////////////////////////////////////////////
// Calendar
/////////////////////////////////////////////////////////////////////////////

export function formatRange(range) {
    return formatTime(range.start) + "–" + formatTime(range.end);
}

export function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

// "HH:MM" -> minutes since midnight, or NaN.
export function parseTime(text) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(text).trim());
    if (match === null)
        return NaN;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 24 || m > 59 || h * 60 + m > 24 * 60)
        return NaN;
    return h * 60 + m;
}

// Start times of the slots of a time range, in minutes.
export function rangeSlotTimes(range, step) {
    const times = [];
    for (let time = range.start; time + step <= range.end; time += step)
        times.push(time);
    return times;
}

// The time ranges of a day, sorted by start.
export function sortedRanges(calendar, day) {
    return [...calendar.days[day].ranges].sort((a, b) => a.start - b.start || a.end - b.end);
}

// Start times of the slots of a day, in minutes, sorted.
export function slotTimes(calendar, day) {
    const times = new Set();
    for (const range of calendar.days[day].ranges)
        for (const time of rangeSlotTimes(range, calendar.step))
            times.add(time);
    return [...times].sort((a, b) => a - b);
}

// The days with time ranges, in order.
export function usedDays(calendar) {
    const days = [];
    calendar.days.forEach((d, day) => {
        if (d.ranges.length > 0)
            days.push(day);
    });
    return days;
}

// The hours covering all the time ranges: '{start, end}', null if there is
// none.
export function weekHours(calendar) {
    const ranges = usedDays(calendar).flatMap((day) => calendar.days[day].ranges);
    if (ranges.length === 0)
        return null;
    return {
        start: Math.min(...ranges.map((r) => r.start)),
        end: Math.max(...ranges.map((r) => r.end)),
    };
}

// The time line of the solver: the slots of the time ranges of the days, one range after the other, each followed by a time step where no one
// is available.
//
//     {horizon, segments: [{day, offset, times}]}
//
// The slot 'i' of a segment is the time step 'offset + i'.
export function timeline(calendar) {
    const segments = [];
    let offset = 0;
    for (const day of usedDays(calendar)) {
        for (const range of sortedRanges(calendar, day)) {
            const times = rangeSlotTimes(range, calendar.step);
            if (times.length === 0)
                continue;
            segments.push({day, offset, times});
            offset += times.length + 1;
        }
    }
    return {horizon: offset, segments};
}

export function slotKey(day, minute) {
    return day + ":" + minute;
}

export function parseSlotKey(key) {
    const [day, minute] = key.split(":").map(Number);
    return {day, minute};
}

// Set the availability of a participant on the slots of [start, end) of a
// day; 'score' null makes them unavailable.
export function setAvailability(participant, day, start, end, score, step) {
    for (let minute = start; minute < end; minute += step) {
        const key = slotKey(day, minute);
        if (score === null)
            delete participant.availability[key];
        else
            participant.availability[key] = score;
    }
}

// Number of slots of the calendar where a participant is available.
export function countAvailableSlots(calendar, participant) {
    let count = 0;
    for (const day of usedDays(calendar))
        for (const minute of slotTimes(calendar, day))
            if (participant.availability[slotKey(day, minute)] !== undefined)
                count++;
    return count;
}

/////////////////////////////////////////////////////////////////////////////
// Instance
/////////////////////////////////////////////////////////////////////////////

// The problems of a project which prevent solving it, and the warnings.
export function check(project) {
    const errors = [];
    const warnings = [];
    const {calendar} = project;
    const days = usedDays(calendar);
    if (days.length === 0)
        errors.push(t("check.noRange"));
    for (const day of days) {
        const ranges = sortedRanges(calendar, day);
        for (const range of ranges) {
            if (rangeSlotTimes(range, calendar.step).length === 0)
                errors.push(t("check.emptyRange", {day: dayName(day), range: formatRange(range)}));
        }
        for (let i = 1; i < ranges.length; ++i) {
            if (ranges[i].start < ranges[i - 1].end) {
                errors.push(t("check.overlappingRanges", {
                    day: dayName(day), first: formatRange(ranges[i - 1]), second: formatRange(ranges[i])}));
            }
        }
    }
    if (project.courses.length === 0)
        errors.push(t("check.noCourse"));
    const ids = new Set(project.participants.map((p) => p.id));
    for (const course of project.courses) {
        if (!(course.duration > 0))
            errors.push(t("check.invalidDuration", {name: course.name}));
        else if (course.duration % calendar.step !== 0)
            warnings.push(t("check.roundedDuration", {
                name: course.name,
                duration: course.duration,
                step: calendar.step,
                rounded: durationInSteps(course, calendar) * calendar.step,
            }));
        if (course.participants.filter((id) => ids.has(id)).length === 0)
            errors.push(t("check.noParticipant", {name: course.name}));
    }
    for (const participant of project.participants) {
        const inCourse = project.courses.some((course) => course.participants.includes(participant.id));
        if (inCourse && countAvailableSlots(calendar, participant) === 0)
            warnings.push(t("check.noAvailability", {name: participant.name}));
    }
    return {errors, warnings};
}

function durationInSteps(course, calendar) {
    return Math.ceil(course.duration / calendar.step);
}

// The instance of the solver of a project:
//
//     {
//         horizon,
//         defaultScore,
//         resources: [[[time, score], ...], ...],  // one per participant
//         events: [{duration, resources: [resourceId, ...]}, ...],  // one per course
//     }
export function toInstance(project) {
    const {calendar} = project;
    const {horizon, segments} = timeline(calendar);
    const resourceIds = new Map(project.participants.map((p, i) => [p.id, i]));
    const resources = project.participants.map((participant) => {
        const scores = [];
        for (const {day, offset, times} of segments) {
            times.forEach((minute, slot) => {
                const score = participant.availability[slotKey(day, minute)];
                if (score !== undefined)
                    scores.push([offset + slot, score]);
            });
        }
        return scores;
    });
    const events = project.courses.map((course) => ({
        duration: durationInSteps(course, calendar),
        resources: course.participants
            .filter((id) => resourceIds.has(id))
            .map((id) => resourceIds.get(id)),
    }));
    return {
        horizon,
        defaultScore: UNAVAILABLE_SCORE,
        resources,
        events,
    };
}

/////////////////////////////////////////////////////////////////////////////
// Timetable
/////////////////////////////////////////////////////////////////////////////

// The timetable of a result of the solver for a project:
//
//     {
//         signature,   // see 'signature': to know if the project changed since
//         score,
//         time,
//         courses: [{
//             courseId,
//             day, start, end,   // null if the course isn't scheduled
//             participants: [{participantId, score, available}],
//         }],
//     }
export function toTimetable(project, result) {
    const {calendar} = project;
    const {segments} = timeline(calendar);
    const participantIds = project.participants.map((p) => p.id);
    return {
        signature: signature(project),
        score: result.score,
        time: result.time,
        courses: project.courses.map((course, eventId) => {
            const event = result.events[eventId];
            const participants = event.resources.map((r) => ({
                participantId: participantIds[r.resource],
                score: r.score,
                available: r.available,
            }));
            if (event.start === null) {
                return {courseId: course.id, day: null, start: null, end: null, participants};
            }
            const {day, offset, times} = segments.findLast((segment) => segment.offset <= event.start);
            const start = times[event.start - offset];
            return {
                courseId: course.id,
                day,
                start,
                end: start + (event.end - event.start) * calendar.step,
                participants,
            };
        }),
    };
}

// What the timetable depends on: when it changes, the timetable is outdated.
export function signature(project) {
    return JSON.stringify([project.calendar, project.participants, project.courses]);
}

// The timetable as a CSV file, with the separator of the spreadsheets of the
// language of the page.
export function timetableCsv(project, timetable) {
    const separator = t("csv.separator");
    const courses = new Map(project.courses.map((c) => [c.id, c]));
    const participants = new Map(project.participants.map((p) => [p.id, p]));
    const escape = (value) => (value.includes(separator) || /["\n]/.test(value))?
        '"' + value.replace(/"/g, '""') + '"':
        value;
    const header = ["csv.course", "csv.day", "csv.start", "csv.end", "csv.participants", "csv.outsideAvailabilities"];
    const lines = [header.map((key) => escape(t(key))).join(separator)];
    const rows = [...timetable.courses].sort(compareScheduledCourses);
    for (const scheduled of rows) {
        const course = courses.get(scheduled.courseId);
        if (course === undefined)
            continue;
        const names = (list) => list.map((p) => participants.get(p.participantId)?.name ?? "?").join(", ");
        lines.push([
            course.name,
            scheduled.day === null? t("result.unscheduled"): dayName(scheduled.day),
            scheduled.start === null? "": formatTime(scheduled.start),
            scheduled.end === null? "": formatTime(scheduled.end),
            names(scheduled.participants),
            scheduled.day === null? "": names(scheduled.participants.filter((p) => !p.available)),
        ].map(escape).join(separator));
    }
    return lines.join("\n") + "\n";
}

// The scheduled courses first, by day and start; then the others.
export function compareScheduledCourses(a, b) {
    if (a.day === null || b.day === null)
        return (a.day === null) - (b.day === null);
    return a.day - b.day || a.start - b.start;
}
