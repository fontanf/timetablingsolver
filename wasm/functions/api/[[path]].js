// Cloudflare Pages Function answering all the requests to '/api/...' (see
// 'wasm/server/api.js').

import {handleApi} from "../../server/api.js";

export function onRequest(context) {
    return handleApi(context.request, context.env);
}
