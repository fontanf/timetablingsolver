// Client of the API of the server (see 'server/api.js'), and the encryption
// of the data sent to it: the server only stores data encrypted in the
// browsers (AES-GCM), with keys which are never sent to it.

/////////////////////////////////////////////////////////////////////////////
// Encryption
/////////////////////////////////////////////////////////////////////////////

function toBase64Url(bytes) {
    let text = "";
    for (const byte of bytes)
        text += String.fromCharCode(byte);
    return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text) {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// A random id or token (128 bits).
export function randomToken() {
    return toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

// A new key (256 bits), as text.
export function generateKey() {
    return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

function importKey(key) {
    return crypto.subtle.importKey("raw", fromBase64Url(key), "AES-GCM", false, ["encrypt", "decrypt"]);
}

// 'value' as JSON, encrypted: the initialization vector followed by the
// encrypted text, in base64url.
export async function encrypt(key, value) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv}, await importKey(key), plaintext));
    const data = new Uint8Array(iv.length + ciphertext.length);
    data.set(iv);
    data.set(ciphertext, iv.length);
    return toBase64Url(data);
}

// Throws if the key is wrong or the data was modified.
export async function decrypt(key, text) {
    const data = fromBase64Url(text);
    const plaintext = await crypto.subtle.decrypt(
        {name: "AES-GCM", iv: data.slice(0, 12)}, await importKey(key), data.slice(12));
    return JSON.parse(new TextDecoder().decode(plaintext));
}

/////////////////////////////////////////////////////////////////////////////
// API
/////////////////////////////////////////////////////////////////////////////

// An error of the API: 'code' is the code of the server (see
// 'server/api.js'), or "network".
export class ApiError extends Error {
    constructor(code) {
        super(code);
        this.code = code;
    }
}

const ERROR_KEYS = {
    "network": "poll.error.network",
    "not-found": "poll.error.notFound",
    "closed": "poll.error.closed",
    "forbidden": "poll.error.forbidden",
    "unauthorized": "poll.error.forbidden",
    "too-large": "poll.error.tooLarge",
    "too-many-responses": "poll.error.tooMany",
};

// The key of the message of an error (see 'i18n.js').
export function errorKey(error) {
    return ERROR_KEYS[error instanceof ApiError? error.code: ""] || "poll.error.server";
}

// Client of the API (see 'server/api.js').
export class Api {
    constructor(baseUrl = "", fetchFunction = (...args) => fetch(...args)) {
        this.baseUrl = baseUrl;
        this.fetch = fetchFunction;
    }

    async request(method, path, {token, body} = {}) {
        const headers = {};
        if (token !== undefined)
            headers.Authorization = "Bearer " + token;
        if (body !== undefined)
            headers["Content-Type"] = "application/json";
        let response;
        try {
            response = await this.fetch(this.baseUrl + "/api" + path, {
                method,
                headers,
                body: body === undefined? undefined: JSON.stringify(body),
            });
        } catch (error) {
            throw new ApiError("network");
        }
        const text = await response.text();
        let json = null;
        try {
            json = text === ""? null: JSON.parse(text);
        } catch (error) {
            // E.g. a page of the host when the API isn't deployed.
        }
        if (!response.ok) {
            const error = new ApiError((json && json.error) || (response.status === 404? "not-found": "server"));
            error.body = json;
            throw error;
        }
        return json;
    }

    readPoll(pollId) {
        return this.request("GET", "/polls/" + pollId);
    }

    updatePoll(pollId, adminToken, changes) {
        return this.request("PUT", "/polls/" + pollId, {token: adminToken, body: changes});
    }

    deletePoll(pollId, adminToken) {
        return this.request("DELETE", "/polls/" + pollId, {token: adminToken});
    }

    async readResponses(pollId, adminToken) {
        return (await this.request("GET", `/polls/${pollId}/responses`, {token: adminToken})).responses;
    }

    readResponse(pollId, responseId, token) {
        return this.request("GET", `/polls/${pollId}/responses/${responseId}`, {token});
    }

    writeResponse(pollId, responseId, token, data) {
        return this.request("PUT", `/polls/${pollId}/responses/${responseId}`, {token, body: {data}});
    }

    readProject(projectId, token) {
        return this.request("GET", "/projects/" + projectId, {token});
    }

    async writeProject(projectId, token, data, version) {
        return (await this.request("PUT", "/projects/" + projectId, {token, body: {data, version}})).version;
    }

    deleteProject(projectId, token) {
        return this.request("DELETE", "/projects/" + projectId, {token});
    }
}
