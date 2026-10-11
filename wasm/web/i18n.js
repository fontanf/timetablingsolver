// Translations of the web page.
//
// The texts of 'index.html' are given by the attributes 'data-i18n' (text),
// 'data-i18n-placeholder', 'data-i18n-aria-label' and 'data-i18n-title', and
// translated by 'translateDocument'. The texts of the scripts are given by
// 't(key, parameters)', where '{name}' in a message is replaced by
// 'parameters.name'.
//
// To add a language: add it to 'LANGUAGES' and to 'MESSAGES', with every key
// of English (checked by the tests).

export const LANGUAGES = {en: "English", fr: "Français"};

export const DEFAULT_LANGUAGE = "en";

// Flags of the languages (inline SVG: the flag emoji aren't displayed on
// Windows).
export const FLAGS = {
    // Cropped to 3:2, as the other flags.
    en: '<svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
        + '<clipPath id="flag-en-t"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath>'
        + '<path d="M0,0v30h60v-30z" fill="#012169"/>'
        + '<path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/>'
        + '<path d="M0,0L60,30M60,0L0,30" clip-path="url(#flag-en-t)" stroke="#c8102e" stroke-width="4"/>'
        + '<path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/>'
        + '<path d="M30,0v30M0,15h60" stroke="#c8102e" stroke-width="6"/>'
        + '</svg>',
    fr: '<svg viewBox="0 0 3 2" aria-hidden="true">'
        + '<rect width="1" height="2" fill="#002654"/>'
        + '<rect x="1" width="1" height="2" fill="#fff"/>'
        + '<rect x="2" width="1" height="2" fill="#ce1126"/>'
        + '</svg>',
};

export const MESSAGES = {
    en: {
        "page.title": "Timetables",
        "page.description": "Build the timetable of your courses from the availabilities of your students. The computation runs in your browser and your projects are stored there: nothing is sent to a server.",
        "page.language": "Language",
        "storage.warning": "The projects can't be stored in this browser (private window?): they will be lost when the page is closed. Export them to keep them.",

        "project.label": "Project",
        "project.new": "New",
        "project.rename": "Rename",
        "project.duplicate": "Duplicate",
        "project.delete": "Delete",
        "project.export": "Export",
        "project.import": "Import",
        "project.newPrompt": "Name of the new project:",
        "project.newDefault": "New project",
        "project.renamePrompt": "New name of the project:",
        "project.copySuffix": "{name} (copy)",
        "project.deleteConfirm": "Delete the project “{name}”? This can't be undone.",
        "project.importError": "The project couldn't be imported: {error}",
        "project.example": "Example",
        "project.exampleOption": "Example (read only)",
        "example.banner": "This example can't be modified. Duplicate it to make your own project, or create a new one.",
        "example.duplicate": "Duplicate the example",
        "project.defaultName": "Project",

        "import.invalidJson": "the file isn't a valid JSON file.",
        "import.invalidFormat": "the file isn't a project exported from this page.",
        "import.newerVersion": "the file was exported by a newer version of this page.",

        "calendar.title": "1. Week",
        "calendar.day": "Day",
        "calendar.weekdays": "Monday to Friday",
        "calendar.everyDay": "Every day",
        "calendar.add": "Add",
        "calendar.noRange": "No time range yet: add the hours when the courses can take place.",
        "calendar.invalidRange": "The end must be after the start.",
        "calendar.overlappingRange": "{day}: the range overlaps {range}.",
        "calendar.removeRange": "Remove the range {range}",
        "calendar.start": "Start",
        "calendar.end": "End",
        "calendar.step": "Step",
        "calendar.minutes": "{minutes} min",

        "poll.title": "2. Ask the students",
        "poll.description": "Create a link and send it to your students: each of them gives their availabilities, then you fetch them here. The answers are encrypted in the browsers: the server can't read them. The link contains the key: only share it with your students.",
        "poll.message": "Message to the students (optional)",
        "poll.create": "Create the link",
        "poll.personalTitle": "Personal links",
        "poll.personalNote": "Send each student their own link: they give their availabilities, and can modify them from any device.",
        "poll.noStudent": "Add your students in section 3 to get their personal links, or use the link below.",
        "poll.student": "Student",
        "poll.status": "Response (at the last fetch)",
        "poll.answered": "Answered on {date}",
        "poll.notAnswered": "Not answered yet",
        "poll.copyLink": "Copy the link",
        "poll.copyAll": "Copy all the links",
        "poll.sharedTitle": "Link for the new students",
        "poll.sharedNote": "For the students who aren't in the project yet: they give their name, and are added to the project when you fetch the responses. Once they answered, they get their personal link.",
        "poll.responsesTitle": "Responses",
        "poll.copy": "Copy",
        "poll.copied": "Copied!",
        "poll.outdated": "The week or your availabilities changed since the link was created: update the poll for the students to see them.",
        "poll.update": "Update the poll",
        "poll.fetch": "Fetch the responses",
        "poll.close": "Close the poll",
        "poll.reopen": "Reopen the poll",
        "poll.closedNote": "The poll is closed: the students can't send or modify their availabilities anymore.",
        "poll.delete": "Delete the poll",
        "poll.deleteConfirm": "Delete the poll and the responses from the server? The link won't work anymore. The availabilities already fetched are kept in the project.",
        "poll.working": "Please wait…",
        "poll.noResponse": "No response yet.",
        "poll.summary": "Responses fetched on {date}:",
        "poll.added": "New students: {names}.",
        "poll.updated": "Availabilities updated: {names}.",
        "poll.unchanged": "Unchanged: {count}.",
        "poll.invalid": "Responses which couldn't be read: {count}.",
        "poll.comment": "Comment: {comment}",
        "poll.error.network": "The server couldn't be reached: check your connection.",
        "poll.error.server": "The server isn't available. Try again later.",
        "poll.error.notFound": "This poll doesn't exist anymore (deleted or expired).",
        "poll.error.closed": "The poll is closed.",
        "poll.error.forbidden": "Access refused.",
        "poll.error.tooLarge": "Too much data.",
        "poll.error.tooMany": "The poll has too many responses.",

        "student.title": "Availabilities",
        "student.loading": "Loading…",
        "student.intro": "{teacher} asks for your availabilities.",
        "student.introTitle": "{teacher} asks for your availabilities for “{title}”.",
        "student.introNoTeacher": "Give your availabilities.",
        "student.availability": "Your availabilities",
        "student.privacy": "Your answers are encrypted: only your teacher can read them.",
        "student.name": "Your name",
        "student.help": "Paint the slots when you are available. The hatched slots are those when the teacher isn't available. The more slots you give, the easier it is to find a timetable for everyone.",
        "student.comment": "Comment (optional)",
        "student.send": "Send my availabilities",
        "student.sending": "Sending…",
        "student.sent": "Your availabilities were sent on {date}. You can modify them with the same link until the poll is closed.",
        "student.ownLink": "Keep this link: it is yours, and lets you modify your availabilities from any device.",
        "student.sentShort": "Your availabilities were sent on {date}.",
        "student.nameRequired": "Enter your name.",
        "student.noSlot": "Select at least one slot.",
        "student.invalidLink": "This link is invalid: check that you copied it entirely.",
        "student.closed": "This poll is closed: the availabilities can't be sent or modified anymore.",

        "participants.title": "3. Participants",
        "participants.name": "Name",
        "participants.role": "Role",
        "participants.availableSlots": "Available slots",
        "participants.actions": "Actions",
        "participants.availability": "Availabilities",
        "participants.delete": "Delete",
        "participants.deleteConfirm": "Delete {name} and their courses?",
        "participants.newStudent": "New student",
        "participants.newStudentPlaceholder": "Name",
        "participants.individualDuration": "Duration of their individual course (min)",
        "participants.add": "Add",
        "participants.zeroDurationNote": "A duration of 0 adds the student without an individual course.",
        "role.teacher": "Teacher",
        "role.student": "Student",
        "names.teacher": "Teacher",
        "names.individualCourse": "{name}'s course",
        "names.collectiveCourse": "Group course",

        "availability.title": "4. Availabilities",
        "availability.participant": "Participant",
        "availability.teacherSuffix": "{name} (teacher)",
        "availability.brush": "Brush",
        "availability.preferred": "Preferred",
        "availability.possible": "Possible",
        "availability.unavailable": "Unavailable",
        "availability.clear": "Clear all",
        "availability.clearConfirm": "Clear all the availabilities of {name}?",
        "availability.note": "Click or drag on the grid to paint the slots. A student may be placed on an unavailable slot if it is the only way to place all the courses: the more slots they give, the less likely it is.",
        "availability.cellLabel": "{day} {time}: {state}",
        "availability.teacherOff": "the teacher isn't available",

        "courses.title": "5. Courses",
        "courses.name": "Name",
        "courses.duration": "Duration (min)",
        "courses.participants": "Participants",
        "courses.actions": "Actions",
        "courses.nameLabel": "Name of the course",
        "courses.durationLabel": "Duration in minutes",
        "courses.none": "None",
        "courses.delete": "Delete",
        "courses.addCollective": "Add a group course",

        "solve.title": "6. Computation",
        "solve.timeLimit": "Time limit (s)",
        "solve.defaultScore": "Penalty of an unavailable slot",
        "solve.note": "A preferred slot costs 0, a possible slot 1. The timetable schedules as many courses as possible, then minimizes the sum of the costs.",
        "solve.solve": "Compute the timetable",
        "solve.stop": "Stop",
        "solve.running": "Computing…",
        "solve.runningSeconds": "Computing… {seconds} s",
        "solve.stopped": "Computation stopped.",
        "solve.error": "Error: {error}",
        "solve.failed": "the computation failed.",

        "check.noRange": "There is no time range in the week.",
        "check.emptyRange": "{day}: the time range {range} is shorter than the step.",
        "check.overlappingRanges": "{day}: the time ranges {first} and {second} overlap.",
        "check.noCourse": "There is no course to schedule.",
        "check.invalidDuration": "The duration of the course “{name}” must be positive.",
        "check.roundedDuration": "The duration of the course “{name}” ({duration} min) isn't a multiple of the step ({step} min): it is rounded up to {rounded} min.",
        "check.noParticipant": "The course “{name}” has no participant.",
        "check.noAvailability": "{name} hasn't given any availability.",

        "result.title": "Timetable",
        "result.outdated": "The project was modified since this timetable was computed.",
        "result.notScheduled": "The course “{name}” couldn't be scheduled.",
        "result.unavailable": "{participant} is scheduled outside their availabilities for “{course}”.",
        "result.course": "Course",
        "result.day": "Day",
        "result.time": "Time",
        "result.participants": "Participants",
        "result.unscheduled": "Not scheduled",
        "result.unavailableTitle": "Scheduled outside their availabilities",
        "result.possibleTitle": "Possible slot (not preferred)",
        "result.exportCsv": "Download (CSV)",
        "result.print": "Print",

        "csv.separator": ",",
        "csv.course": "Course",
        "csv.day": "Day",
        "csv.start": "Start",
        "csv.end": "End",
        "csv.participants": "Participants",
        "csv.outsideAvailabilities": "Outside availabilities",
    },
    fr: {
        "page.title": "Emplois du temps",
        "page.description": "Construisez l'emploi du temps de vos cours à partir des disponibilités de vos élèves. Le calcul est fait dans votre navigateur et vos projets y sont enregistrés : rien n'est envoyé à un serveur.",
        "page.language": "Langue",
        "storage.warning": "Les projets ne peuvent pas être enregistrés dans ce navigateur (navigation privée ?) : ils seront perdus à la fermeture de la page. Exportez-les pour les conserver.",

        "project.label": "Projet",
        "project.new": "Nouveau",
        "project.rename": "Renommer",
        "project.duplicate": "Dupliquer",
        "project.delete": "Supprimer",
        "project.export": "Exporter",
        "project.import": "Importer",
        "project.newPrompt": "Nom du nouveau projet :",
        "project.newDefault": "Nouveau projet",
        "project.renamePrompt": "Nouveau nom du projet :",
        "project.copySuffix": "{name} (copie)",
        "project.deleteConfirm": "Supprimer le projet « {name} » ? Cette action est définitive.",
        "project.importError": "Impossible d'importer le projet : {error}",
        "project.example": "Exemple",
        "project.exampleOption": "Exemple (lecture seule)",
        "example.banner": "Cet exemple ne peut pas être modifié. Dupliquez-le pour en faire votre propre projet, ou créez-en un nouveau.",
        "example.duplicate": "Dupliquer l'exemple",
        "project.defaultName": "Projet",

        "import.invalidJson": "le fichier n'est pas un fichier JSON valide.",
        "import.invalidFormat": "le fichier n'est pas un projet exporté depuis cette page.",
        "import.newerVersion": "le fichier a été exporté par une version plus récente de cette page.",

        "calendar.title": "1. Semaine",
        "calendar.day": "Jour",
        "calendar.weekdays": "Du lundi au vendredi",
        "calendar.everyDay": "Tous les jours",
        "calendar.add": "Ajouter",
        "calendar.noRange": "Aucune plage horaire pour l'instant : ajoutez les horaires où les cours peuvent avoir lieu.",
        "calendar.invalidRange": "La fin doit être après le début.",
        "calendar.overlappingRange": "{day} : la plage chevauche {range}.",
        "calendar.removeRange": "Supprimer la plage {range}",
        "calendar.start": "Début",
        "calendar.end": "Fin",
        "calendar.step": "Pas",
        "calendar.minutes": "{minutes} min",

        "poll.title": "2. Demander aux élèves",
        "poll.description": "Créez un lien et envoyez-le à vos élèves : chacun indique ses disponibilités, puis vous les récupérez ici. Les réponses sont chiffrées dans les navigateurs : le serveur ne peut pas les lire. Le lien contient la clé : ne le partagez qu'avec vos élèves.",
        "poll.message": "Message aux élèves (facultatif)",
        "poll.create": "Créer le lien",
        "poll.personalTitle": "Liens personnels",
        "poll.personalNote": "Envoyez à chaque élève son propre lien : il indique ses disponibilités, et peut les modifier depuis n'importe quel appareil.",
        "poll.noStudent": "Ajoutez vos élèves dans la section 3 pour obtenir leurs liens personnels, ou utilisez le lien ci-dessous.",
        "poll.student": "Élève",
        "poll.status": "Réponse (à la dernière récupération)",
        "poll.answered": "A répondu le {date}",
        "poll.notAnswered": "Pas encore de réponse",
        "poll.copyLink": "Copier le lien",
        "poll.copyAll": "Copier tous les liens",
        "poll.sharedTitle": "Lien pour les nouveaux élèves",
        "poll.sharedNote": "Pour les élèves qui ne sont pas encore dans le projet : ils indiquent leur nom, et sont ajoutés au projet quand vous récupérez les réponses. Une fois qu'ils ont répondu, ils reçoivent leur lien personnel.",
        "poll.responsesTitle": "Réponses",
        "poll.copy": "Copier",
        "poll.copied": "Copié !",
        "poll.outdated": "La semaine ou vos disponibilités ont changé depuis la création du lien : mettez à jour le sondage pour que les élèves les voient.",
        "poll.update": "Mettre à jour le sondage",
        "poll.fetch": "Récupérer les réponses",
        "poll.close": "Fermer le sondage",
        "poll.reopen": "Rouvrir le sondage",
        "poll.closedNote": "Le sondage est fermé : les élèves ne peuvent plus envoyer ni modifier leurs disponibilités.",
        "poll.delete": "Supprimer le sondage",
        "poll.deleteConfirm": "Supprimer le sondage et les réponses du serveur ? Le lien ne fonctionnera plus. Les disponibilités déjà récupérées restent dans le projet.",
        "poll.working": "Veuillez patienter…",
        "poll.noResponse": "Aucune réponse pour l'instant.",
        "poll.summary": "Réponses récupérées le {date} :",
        "poll.added": "Nouveaux élèves : {names}.",
        "poll.updated": "Disponibilités mises à jour : {names}.",
        "poll.unchanged": "Inchangées : {count}.",
        "poll.invalid": "Réponses illisibles : {count}.",
        "poll.comment": "Commentaire : {comment}",
        "poll.error.network": "Le serveur n'a pas pu être contacté : vérifiez votre connexion.",
        "poll.error.server": "Le serveur n'est pas disponible. Réessayez plus tard.",
        "poll.error.notFound": "Ce sondage n'existe plus (supprimé ou expiré).",
        "poll.error.closed": "Le sondage est fermé.",
        "poll.error.forbidden": "Accès refusé.",
        "poll.error.tooLarge": "Trop de données.",
        "poll.error.tooMany": "Le sondage a trop de réponses.",

        "student.title": "Disponibilités",
        "student.loading": "Chargement…",
        "student.intro": "{teacher} vous demande vos disponibilités.",
        "student.introTitle": "{teacher} vous demande vos disponibilités pour « {title} ».",
        "student.introNoTeacher": "Indiquez vos disponibilités.",
        "student.availability": "Vos disponibilités",
        "student.privacy": "Vos réponses sont chiffrées : seul votre professeur peut les lire.",
        "student.name": "Votre nom",
        "student.help": "Peignez les créneaux où vous êtes disponible. Les créneaux hachurés sont ceux où le professeur n'est pas disponible. Plus vous indiquez de créneaux, plus il est facile de trouver un emploi du temps pour tous.",
        "student.comment": "Commentaire (facultatif)",
        "student.send": "Envoyer mes disponibilités",
        "student.sending": "Envoi…",
        "student.sent": "Vos disponibilités ont été envoyées le {date}. Vous pouvez les modifier avec le même lien tant que le sondage est ouvert.",
        "student.ownLink": "Gardez ce lien : c'est le vôtre, il vous permet de modifier vos disponibilités depuis n'importe quel appareil.",
        "student.sentShort": "Vos disponibilités ont été envoyées le {date}.",
        "student.nameRequired": "Indiquez votre nom.",
        "student.noSlot": "Sélectionnez au moins un créneau.",
        "student.invalidLink": "Ce lien n'est pas valide : vérifiez que vous l'avez copié en entier.",
        "student.closed": "Ce sondage est fermé : les disponibilités ne peuvent plus être envoyées ni modifiées.",

        "participants.title": "3. Participants",
        "participants.name": "Nom",
        "participants.role": "Rôle",
        "participants.availableSlots": "Créneaux disponibles",
        "participants.actions": "Actions",
        "participants.availability": "Disponibilités",
        "participants.delete": "Supprimer",
        "participants.deleteConfirm": "Supprimer {name} et ses cours ?",
        "participants.newStudent": "Nouvel élève",
        "participants.newStudentPlaceholder": "Nom",
        "participants.individualDuration": "Durée de son cours individuel (min)",
        "participants.add": "Ajouter",
        "participants.zeroDurationNote": "Une durée de 0 ajoute l'élève sans cours individuel.",
        "role.teacher": "Professeur",
        "role.student": "Élève",
        "names.teacher": "Professeur",
        "names.individualCourse": "Cours de {name}",
        "names.collectiveCourse": "Cours collectif",

        "availability.title": "4. Disponibilités",
        "availability.participant": "Participant",
        "availability.teacherSuffix": "{name} (professeur)",
        "availability.brush": "Pinceau",
        "availability.preferred": "Préféré",
        "availability.possible": "Possible",
        "availability.unavailable": "Indisponible",
        "availability.clear": "Tout effacer",
        "availability.clearConfirm": "Effacer toutes les disponibilités de {name} ?",
        "availability.note": "Cliquez ou faites glisser sur la grille pour peindre les créneaux. Un élève peut être placé sur un créneau indisponible si c'est le seul moyen de placer tous les cours : plus il indique de créneaux, moins cela risque d'arriver.",
        "availability.cellLabel": "{day} {time} : {state}",
        "availability.teacherOff": "le professeur n'est pas disponible",

        "courses.title": "5. Cours",
        "courses.name": "Nom",
        "courses.duration": "Durée (min)",
        "courses.participants": "Participants",
        "courses.actions": "Actions",
        "courses.nameLabel": "Nom du cours",
        "courses.durationLabel": "Durée en minutes",
        "courses.none": "Aucun",
        "courses.delete": "Supprimer",
        "courses.addCollective": "Ajouter un cours collectif",

        "solve.title": "6. Calcul",
        "solve.timeLimit": "Temps maximum (s)",
        "solve.defaultScore": "Pénalité d'un créneau indisponible",
        "solve.note": "Un créneau préféré coûte 0, un créneau possible 1. L'emploi du temps place le plus de cours possible, puis minimise la somme des coûts.",
        "solve.solve": "Calculer l'emploi du temps",
        "solve.stop": "Arrêter",
        "solve.running": "Calcul en cours…",
        "solve.runningSeconds": "Calcul en cours… {seconds} s",
        "solve.stopped": "Calcul arrêté.",
        "solve.error": "Erreur : {error}",
        "solve.failed": "le calcul a échoué.",

        "check.noRange": "La semaine ne contient aucune plage horaire.",
        "check.emptyRange": "{day} : la plage horaire {range} est plus courte que le pas.",
        "check.overlappingRanges": "{day} : les plages horaires {first} et {second} se chevauchent.",
        "check.noCourse": "Il n'y a aucun cours à placer.",
        "check.invalidDuration": "La durée du cours « {name} » doit être positive.",
        "check.roundedDuration": "La durée du cours « {name} » ({duration} min) n'est pas un multiple du pas ({step} min) : elle est arrondie à {rounded} min.",
        "check.noParticipant": "Le cours « {name} » n'a aucun participant.",
        "check.noAvailability": "{name} n'a indiqué aucune disponibilité.",

        "result.title": "Emploi du temps",
        "result.outdated": "Le projet a été modifié depuis le calcul de cet emploi du temps.",
        "result.notScheduled": "Le cours « {name} » n'a pas pu être placé.",
        "result.unavailable": "{participant} est placé hors de ses disponibilités pour « {course} ».",
        "result.course": "Cours",
        "result.day": "Jour",
        "result.time": "Horaire",
        "result.participants": "Participants",
        "result.unscheduled": "Non placé",
        "result.unavailableTitle": "Placé hors de ses disponibilités",
        "result.possibleTitle": "Créneau possible (non préféré)",
        "result.exportCsv": "Télécharger (CSV)",
        "result.print": "Imprimer",

        "csv.separator": ";",
        "csv.course": "Cours",
        "csv.day": "Jour",
        "csv.start": "Début",
        "csv.end": "Fin",
        "csv.participants": "Participants",
        "csv.outsideAvailabilities": "Hors disponibilités",
    },
};

let language = DEFAULT_LANGUAGE;

export function getLanguage() {
    return language;
}

export function setLanguage(newLanguage) {
    language = (newLanguage in MESSAGES)? newLanguage: DEFAULT_LANGUAGE;
}

// The language of the page: the stored choice, otherwise the first language
// of the browser which is available, otherwise English.
export function detectLanguage(stored, browserLanguages = []) {
    if (stored in MESSAGES)
        return stored;
    for (const browserLanguage of browserLanguages) {
        const code = String(browserLanguage).toLowerCase().split("-")[0];
        if (code in MESSAGES)
            return code;
    }
    return DEFAULT_LANGUAGE;
}

export function t(key, parameters = {}) {
    const message = MESSAGES[language][key] ?? MESSAGES[DEFAULT_LANGUAGE][key];
    if (message === undefined) {
        console.error("Missing translation: " + key);
        return key;
    }
    return message.replace(/\{(\w+)\}/g, (match, name) =>
        (name in parameters)? String(parameters[name]): match);
}

// Name of a day (0: Monday, ..., 6: Sunday), capitalized; 'width': "long"
// or "short".
export function dayName(day, width = "long") {
    // 2024-01-01 is a Monday.
    const date = new Date(Date.UTC(2024, 0, 1 + day));
    const name = new Intl.DateTimeFormat(language, {weekday: width, timeZone: "UTC"}).format(date);
    return name.charAt(0).toLocaleUpperCase(language) + name.slice(1);
}

// Translate the elements of 'root' with the attributes 'data-i18n*'.
export function translateDocument(root = document) {
    for (const element of root.querySelectorAll("[data-i18n]"))
        element.textContent = t(element.dataset.i18n);
    for (const element of root.querySelectorAll("[data-i18n-placeholder]"))
        element.placeholder = t(element.dataset.i18nPlaceholder);
    for (const element of root.querySelectorAll("[data-i18n-aria-label]"))
        element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    for (const element of root.querySelectorAll("[data-i18n-title]"))
        element.title = t(element.dataset.i18nTitle);
    if (root.documentElement !== undefined) {
        root.documentElement.lang = language;
        root.title = t("page.title");
    }
}
