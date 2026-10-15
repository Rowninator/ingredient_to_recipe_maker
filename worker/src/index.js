// Pantry Match AI proxy: takes a pantry list from the page, asks Gemini for up
// to 3 recipes, and returns only checked recipes. The Gemini key never leaves
// this Worker. Request flow and status codes are in SPEC.md.

import { GoogleGenAI, ThinkingLevel, FinishReason } from "@google/genai";
import { buildPrompt } from "../../suggest.js";
import { readReply } from "../../reply.js";

const MODEL = "gemini-3.8-flash";
const PROD_ORIGIN = "https://rowninator.github.io";
const TIMEOUT_MS = 15000;

// What Gemini must reply with: the "Shapes" section of SPEC.md.
const RECIPES_SCHEMA = {
  type: "object",
  properties: {
    recipes: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          ingredients: { type: "array", minItems: 2, maxItems: 12, items: { type: "string" } },
          steps: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
        },
        required: ["name", "ingredients", "steps"],
      },
    },
  },
  required: ["recipes"],
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (!allowedOrigins(env).includes(origin)) {
      return json(403, { error: "forbidden" }, null);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return json(405, { error: "method_not_allowed" }, origin);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    let success;
    try {
      ({ success } = await env.RATE_LIMITER.limit({ key: ip }));
    } catch (error) {
      console.log("Rate limiter error", error?.name);
      return json(500, { error: "server_error" }, origin);
    }
    if (!success) {
      return json(429, { error: "rate_limited" }, origin);
    }

    const pantry = await readPantry(request);
    if (!pantry) {
      return json(400, { error: "bad_request" }, origin);
    }
    const prompt = buildPrompt(pantry);
    if (!prompt) {
      return json(400, { error: "bad_request" }, origin);
    }

    const signal = AbortSignal.timeout(TIMEOUT_MS);
    let response;
    try {
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt.user,
        config: {
          systemInstruction: prompt.system,
          responseMimeType: "application/json",
          responseJsonSchema: RECIPES_SCHEMA,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: signal,
        },
      });
    } catch (error) {
      // Never pass Google's error details on to the page.
      if (signal.aborted) {
        return json(504, { error: "timeout" }, origin);
      }
      if (error?.status === 429) {
        return json(503, { error: "quota" }, origin);
      }
      console.log("Gemini error", error?.status ?? error?.name);
      return json(502, { error: "bad_reply" }, origin);
    }

    if (response.candidates?.[0]?.finishReason !== FinishReason.STOP) {
      return json(502, { error: "bad_reply" }, origin);
    }
    const { status, body } = readReply(response.text, pantry);
    return json(status, body, origin);
  },
};

// DEV_ORIGIN is set only in worker/.dev.vars, so the deployed Worker
// allows just the live site.
function allowedOrigins(env) {
  return env.DEV_ORIGIN ? [PROD_ORIGIN, env.DEV_ORIGIN] : [PROD_ORIGIN];
}

// The body must be {"pantry": [...]} with 1-40 strings of at most 40
// characters each and no commas (the prompt separates items with commas).
// Returns the list, or null if the body is anything else.
async function readPantry(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  const pantry = body?.pantry;
  const ok =
    Array.isArray(pantry) &&
    pantry.length >= 1 &&
    pantry.length <= 40 &&
    pantry.every((item) => typeof item === "string" && item.length <= 40 && !item.includes(","));
  return ok ? pantry : null;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// origin is null for a refused Origin, so no CORS headers are sent and the
// browser blocks the page from reading the response.
function json(status, body, origin) {
  const headers = { "Content-Type": "application/json", ...(origin ? corsHeaders(origin) : {}) };
  return new Response(JSON.stringify(body), { status, headers });
}
