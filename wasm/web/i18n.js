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
        "page.description": "Build the timetable of your courses from the availabilities of the participants. The computation runs in your browser. Your projects are stored in your browser, with an encrypted copy online to open them on your other devices.",
        "page.language": "Language",
        "storage.warning": "The projects can't be stored in this browser (private window?): they will be lost when the page is closed. Export them to keep them.",

        "project.label": "Project",
        "project.new": "New",
        "project.rename": "Rename",
        "project.duplicate": "Duplicate",
        "project.delete": "Delete",
        "project.export": "Export",
        "project.import": "Import",
        "sync.link": "Link",
        "sync.sendEmail": "Send by email",
        "sync.sendEmailLong": "Send it to me by email",
        "sync.savedIt": "I saved it",
        "sync.reminder": "Keep the link of this project: it is the only way to find it on another device, or if this browser loses its data.",
        "sync.emailSubject": "Link of the project “{name}”",
        "sync.emailBody": "Here is the link of your project “{name}”. Open it to find the project on any device.\nKeep it private: anyone with this link can see and modify the project.\n\n{link}\n",
        "sync.description": "Open this link on your other devices to edit this project there too. The changes are saved online automatically, encrypted: the server can't read them. Anyone with this link can see and modify the project: keep it private.",
        "sync.saving": "Saving online…",
        "sync.saved": "Saved online",
        "sync.offline": "Not saved online (no connection): it will be saved later.",
        "sync.error": "Not saved online: {error}",
        "sync.conflict": "The project “{name}” was modified on another device.\n\nOK: take the version of the other device (the recent modifications made here are lost).\nCancel: keep the version of this device (it replaces the other one).",
        "sync.openError": "The project of this link couldn't be opened: {error}",
        "sync.notFound": "it doesn't exist anymore (deleted or expired).",
        "project.newPrompt": "Name of the new project:",
        "project.newDefault": "New project",
        "project.renamePrompt": "New name of the project:",
        "project.copySuffix": "{name} (copy)",
        "project.deleteConfirm": "Delete the project “{name}”? Its copy online is deleted too: its link won't work anymore on your other devices. This can't be undone.",
        "project.importError": "The project couldn't be imported: {error}",
        "project.example": "Example",
        "project.exampleOption": "Example (read only)",
        "example.banner": "This example can't be modified. Duplicate it to make your own project, or create a new one.",
        "example.duplicate": "Duplicate the example",
        "project.defaultName": "Project",

        "import.invalidJson": "the file isn't a valid JSON file.",
        "import.invalidFormat": "the file isn't a project exported from this page.",
        "import.newerVersion": "the file was exported by a newer version of this page.",

        "calendar.title": "1. Your availabilities",
        "calendar.help": "Paint the slots when you are available for the courses: click or drag on the grid. The courses are scheduled on these slots, and the participants give their availabilities on them.",
        "calendar.noRange": "You haven't given any availability yet: paint the slots when the courses can take place.",
        "calendar.step": "Step",
        "calendar.minutes": "{minutes} min",

        "poll.message": "Message to the participants (optional)",
        "poll.status": "Response",
        "poll.answered": "Answered on {date}",
        "poll.notAnswered": "Not answered yet",
        "poll.copyLink": "Copy the link",
        "poll.copyAll": "Copy all the links",
        "poll.sharedTitle": "Link for the new participants",
        "poll.sharedNote": "For the participants who aren't in the project yet: they give their name, and are added to the project when you fetch the responses. Once they answered, they get their personal link.",
        "participants.linksNote": "Each participant has their own link: send it to them (Copy the link), they give their availabilities, which are fetched here when the project is opened.",
        "poll.options": "Link options",
        "poll.privacyNote": "The answers are encrypted in the browsers: the server can't read them. The links contain the key: only share them with the participants.",
        "poll.reset": "Reset the links",
        "poll.resetConfirm": "Replace all the links (personal and shared) by new ones? The current links won't work anymore: you will have to send the new ones. The availabilities already fetched are kept.",
        "poll.publishing": "Updating the poll online…",
        "poll.published": "✓ The links are ready",
        "poll.offline": "The poll isn't up to date online (no connection): it will be updated later.",
        "poll.publishError": "The poll isn't up to date online: {error}",
        "poll.fetching": "Fetching the answers…",
        "poll.copy": "Copy",
        "poll.copied": "Copied!",
        "poll.fetch": "Fetch the responses",
        "poll.close": "Close the poll",
        "poll.reopen": "Reopen the poll",
        "poll.closedNote": "The poll is closed: the participants can't send or modify their availabilities anymore.",
        "poll.noResponse": "No response yet.",
        "poll.summary": "Responses fetched on {date}:",
        "poll.added": "New participants: {names}.",
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
        "student.intro": "Please give your availabilities.",
        "student.introTitle": "Please give your availabilities for “{title}”.",
        "student.introNamed": "{name}, please give your availabilities.",
        "student.introNamedTitle": "{name}, please give your availabilities for “{title}”.",
        "student.availability": "Your availabilities",
        "student.privacy": "Your answers are encrypted: only the organizer can read them.",
        "student.name": "Your name",
        "student.help": "Paint the slots when you are available. The hatched slots are those when the organizer isn't available. The more slots you give, the easier it is to find a timetable for everyone.",
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

        "participants.title": "2. Participants",
        "participants.name": "Name",
        "participants.role": "Role",
        "participants.availableSlots": "Available slots",
        "participants.actions": "Actions",
        "participants.availability": "Availabilities",
        "participants.delete": "Delete",
        "participants.deleteConfirm": "Delete {name} and their courses?",
        "participants.newStudent": "New participant",
        "participants.newStudentPlaceholder": "Name",
        "participants.individualDuration": "Duration of their individual course (min)",
        "participants.add": "Add",
        "participants.zeroDurationNote": "A duration of 0 adds the participant without an individual course.",
        "role.teacher": "Organizer",
        "role.student": "Participant",
        "names.teacher": "Organizer",
        "names.individualCourse": "{name}'s course",
        "names.collectiveCourse": "Group course",
        "names.levelGroupCourse": "Group course – level {level}",

        "availability.title": "3. Availabilities of the participants",
        "availability.participant": "Participant",
        "availability.noParticipant": "No participant yet: add them in section 2.",
        "availability.brush": "Brush",
        "availability.preferred": "Preferred",
        "availability.possible": "Possible",
        "availability.unavailable": "Unavailable",
        "availability.note": "The availabilities given by each participant with their link: only they can modify them. A participant may be placed on an unavailable slot if it is the only way to place all the courses: the more slots they give, the less likely it is.",
        "availability.cellLabel": "{day} {time}: {state}",
        "availability.teacherOff": "the organizer isn't available",

        "courses.title": "4. Courses",
        "courses.name": "Name",
        "courses.duration": "Duration (min)",
        "courses.participants": "Participants",
        "courses.actions": "Actions",
        "courses.nameLabel": "Name of the course",
        "courses.durationLabel": "Duration in minutes",
        "courses.none": "None",
        "courses.delete": "Delete",
        "courses.addCollective": "Add a group course",

        "solve.title": "5. Computation",
        "solve.timeLimit": "Time limit (s)",
        "solve.note": "The timetable schedules as many courses as possible, on the preferred slots of the participants when possible.",
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
        "page.description": "Construisez l'emploi du temps de vos cours à partir des disponibilités des participants. Le calcul est fait dans votre navigateur. Vos projets sont enregistrés dans votre navigateur, avec une copie chiffrée en ligne pour les ouvrir sur vos autres appareils.",
        "page.language": "Langue",
        "storage.warning": "Les projets ne peuvent pas être enregistrés dans ce navigateur (navigation privée ?) : ils seront perdus à la fermeture de la page. Exportez-les pour les conserver.",

        "project.label": "Projet",
        "project.new": "Nouveau",
        "project.rename": "Renommer",
        "project.duplicate": "Dupliquer",
        "project.delete": "Supprimer",
        "project.export": "Exporter",
        "project.import": "Importer",
        "sync.link": "Lien",
        "sync.sendEmail": "Envoyer par e-mail",
        "sync.sendEmailLong": "Me l'envoyer par e-mail",
        "sync.savedIt": "Je l'ai gardé",
        "sync.reminder": "Gardez le lien de ce projet : c'est le seul moyen de le retrouver sur un autre appareil, ou si ce navigateur perd ses données.",
        "sync.emailSubject": "Lien du projet « {name} »",
        "sync.emailBody": "Voici le lien de votre projet « {name} ». Ouvrez-le pour retrouver le projet sur n'importe quel appareil.\nGardez-le privé : toute personne qui a ce lien peut voir et modifier le projet.\n\n{link}\n",
        "sync.description": "Ouvrez ce lien sur vos autres appareils pour y modifier aussi ce projet. Les modifications sont enregistrées en ligne automatiquement, chiffrées : le serveur ne peut pas les lire. Toute personne qui a ce lien peut voir et modifier le projet : gardez-le privé.",
        "sync.saving": "Enregistrement en ligne…",
        "sync.saved": "Enregistré en ligne",
        "sync.offline": "Pas enregistré en ligne (pas de connexion) : il le sera plus tard.",
        "sync.error": "Pas enregistré en ligne : {error}",
        "sync.conflict": "Le projet « {name} » a été modifié sur un autre appareil.\n\nOK : prendre la version de l'autre appareil (les modifications récentes faites ici sont perdues).\nAnnuler : garder la version de cet appareil (elle remplace l'autre).",
        "sync.openError": "Le projet de ce lien n'a pas pu être ouvert : {error}",
        "sync.notFound": "il n'existe plus (supprimé ou expiré).",
        "project.newPrompt": "Nom du nouveau projet :",
        "project.newDefault": "Nouveau projet",
        "project.renamePrompt": "Nouveau nom du projet :",
        "project.copySuffix": "{name} (copie)",
        "project.deleteConfirm": "Supprimer le projet « {name} » ? Sa copie en ligne est supprimée aussi : son lien ne fonctionnera plus sur vos autres appareils. Cette action est définitive.",
        "project.importError": "Impossible d'importer le projet : {error}",
        "project.example": "Exemple",
        "project.exampleOption": "Exemple (lecture seule)",
        "example.banner": "Cet exemple ne peut pas être modifié. Dupliquez-le pour en faire votre propre projet, ou créez-en un nouveau.",
        "example.duplicate": "Dupliquer l'exemple",
        "project.defaultName": "Projet",

        "import.invalidJson": "le fichier n'est pas un fichier JSON valide.",
        "import.invalidFormat": "le fichier n'est pas un projet exporté depuis cette page.",
        "import.newerVersion": "le fichier a été exporté par une version plus récente de cette page.",

        "calendar.title": "1. Vos disponibilités",
        "calendar.help": "Peignez les créneaux où vous êtes disponible pour les cours : cliquez ou faites glisser sur la grille. Les cours sont placés sur ces créneaux, et les participants y indiquent leurs disponibilités.",
        "calendar.noRange": "Vous n'avez indiqué aucune disponibilité : peignez les créneaux où les cours peuvent avoir lieu.",
        "calendar.step": "Pas",
        "calendar.minutes": "{minutes} min",

        "poll.message": "Message aux participants (facultatif)",
        "poll.status": "Réponse",
        "poll.answered": "A répondu le {date}",
        "poll.notAnswered": "Pas encore de réponse",
        "poll.copyLink": "Copier le lien",
        "poll.copyAll": "Copier tous les liens",
        "poll.sharedTitle": "Lien pour les nouveaux participants",
        "poll.sharedNote": "Pour les participants qui ne sont pas encore dans le projet : ils indiquent leur nom, et sont ajoutés au projet quand vous récupérez les réponses. Une fois qu'ils ont répondu, ils reçoivent leur lien personnel.",
        "participants.linksNote": "Chaque participant a son propre lien : envoyez-le-lui (Copier le lien), il indique ses disponibilités, qui sont récupérées ici à l'ouverture du projet.",
        "poll.options": "Options des liens",
        "poll.privacyNote": "Les réponses sont chiffrées dans les navigateurs : le serveur ne peut pas les lire. Les liens contiennent la clé : ne les partagez qu'avec les participants.",
        "poll.reset": "Renouveler les liens",
        "poll.resetConfirm": "Remplacer tous les liens (personnels et partagé) par de nouveaux ? Les liens actuels ne fonctionneront plus : il faudra envoyer les nouveaux. Les disponibilités déjà récupérées sont conservées.",
        "poll.publishing": "Mise à jour du sondage en ligne…",
        "poll.published": "✓ Les liens sont prêts",
        "poll.offline": "Le sondage n'est pas à jour en ligne (pas de connexion) : il le sera plus tard.",
        "poll.publishError": "Le sondage n'est pas à jour en ligne : {error}",
        "poll.fetching": "Récupération des réponses…",
        "poll.copy": "Copier",
        "poll.copied": "Copié !",
        "poll.fetch": "Récupérer les réponses",
        "poll.close": "Fermer le sondage",
        "poll.reopen": "Rouvrir le sondage",
        "poll.closedNote": "Le sondage est fermé : les participants ne peuvent plus envoyer ni modifier leurs disponibilités.",
        "poll.noResponse": "Aucune réponse pour l'instant.",
        "poll.summary": "Réponses récupérées le {date} :",
        "poll.added": "Nouveaux participants : {names}.",
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
        "student.intro": "Merci d'indiquer vos disponibilités.",
        "student.introTitle": "Merci d'indiquer vos disponibilités pour « {title} ».",
        "student.introNamed": "{name}, merci d'indiquer vos disponibilités.",
        "student.introNamedTitle": "{name}, merci d'indiquer vos disponibilités pour « {title} ».",
        "student.availability": "Vos disponibilités",
        "student.privacy": "Vos réponses sont chiffrées : seul l'organisateur peut les lire.",
        "student.name": "Votre nom",
        "student.help": "Peignez les créneaux où vous êtes disponible. Les créneaux hachurés sont ceux où l'organisateur n'est pas disponible. Plus vous indiquez de créneaux, plus il est facile de trouver un emploi du temps pour tous.",
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

        "participants.title": "2. Participants",
        "participants.name": "Nom",
        "participants.role": "Rôle",
        "participants.availableSlots": "Créneaux disponibles",
        "participants.actions": "Actions",
        "participants.availability": "Disponibilités",
        "participants.delete": "Supprimer",
        "participants.deleteConfirm": "Supprimer {name} et ses cours ?",
        "participants.newStudent": "Nouveau participant",
        "participants.newStudentPlaceholder": "Nom",
        "participants.individualDuration": "Durée de son cours individuel (min)",
        "participants.add": "Ajouter",
        "participants.zeroDurationNote": "Une durée de 0 ajoute le participant sans cours individuel.",
        "role.teacher": "Organisateur",
        "role.student": "Participant",
        "names.teacher": "Organisateur",
        "names.individualCourse": "Cours de {name}",
        "names.collectiveCourse": "Cours collectif",
        "names.levelGroupCourse": "Cours collectif – niveau {level}",

        "availability.title": "3. Disponibilités des participants",
        "availability.participant": "Participant",
        "availability.noParticipant": "Aucun participant pour l'instant : ajoutez-les dans la section 2.",
        "availability.brush": "Pinceau",
        "availability.preferred": "Préféré",
        "availability.possible": "Possible",
        "availability.unavailable": "Indisponible",
        "availability.note": "Les disponibilités indiquées par chaque participant avec son lien : lui seul peut les modifier. Un participant peut être placé sur un créneau indisponible si c'est le seul moyen de placer tous les cours : plus il indique de créneaux, moins cela risque d'arriver.",
        "availability.cellLabel": "{day} {time} : {state}",
        "availability.teacherOff": "l'organisateur n'est pas disponible",

        "courses.title": "4. Cours",
        "courses.name": "Nom",
        "courses.duration": "Durée (min)",
        "courses.participants": "Participants",
        "courses.actions": "Actions",
        "courses.nameLabel": "Nom du cours",
        "courses.durationLabel": "Durée en minutes",
        "courses.none": "Aucun",
        "courses.delete": "Supprimer",
        "courses.addCollective": "Ajouter un cours collectif",

        "solve.title": "5. Calcul",
        "solve.timeLimit": "Temps maximum (s)",
        "solve.note": "L'emploi du temps place le plus de cours possible, sur les créneaux préférés des participants autant que possible.",
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
