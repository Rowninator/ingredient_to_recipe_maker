// Tests the Worker's handling of Gemini errors with made-up Gemini replies.
// globalThis.fetch is faked, so the real SDK runs (including its retries) but
// no request leaves the computer and no key is needed.
// Run with `npm test` in worker/ (uses the SDK's browser build, like Wrangler).

import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import worker from "./index.js";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

// Each call to Gemini gets the next reply in the list; the last one repeats.
let geminiCalls = 0;
function fakeGemini(...replies) {
  geminiCalls = 0;
  globalThis.fetch = async () => replies[Math.min(geminiCalls++, replies.length - 1)]();
}

function geminiError(code, status) {
  return () => Response.json({ error: { code, status, message: "Google's private details" } }, { status: code });
}

function geminiText(text) {
  return () => Response.json({
    candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }],
  });
}

const env = {
  GEMINI_API_KEY: "fake-key",
  RATE_LIMITER: { limit: async () => ({ success: true }) },
};

async function askWorker(pantry = ["eggs", "cheese"]) {
  const request = new Request("https://worker.test/", {
    method: "POST",
    headers: { Origin: "https://rowninator.github.io", "Content-Type": "application/json" },
    body: JSON.stringify({ pantry }),
  });
  const response = await worker.fetch(request, env);
  return { status: response.status, body: await response.json() };
}

// A CORS preflight from the given Origin (null sends no Origin header).
function preflight(origin, testEnv = env) {
  const headers = origin === null ? {} : { Origin: origin };
  return worker.fetch(new Request("https://worker.test/", { method: "OPTIONS", headers }), testEnv);
}

test("Worker allows the Android app's origin", async () => {
  const response = await preflight("https://localhost");
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://localhost");
});

test("Worker refuses origins that only look like the app's, without CORS headers", async () => {
  for (const origin of ["http://localhost", "https://localhost:3000", "https://evil.example", null]) {
    const response = await preflight(origin);
    assert.equal(response.status, 403, `${origin} should be refused`);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  }
});

test("Worker refuses the dev origin unless DEV_ORIGIN is set", async () => {
  assert.equal((await preflight("http://localhost:3000")).status, 403);
  const devEnv = { ...env, DEV_ORIGIN: "http://localhost:3000" };
  assert.equal((await preflight("http://localhost:3000", devEnv)).status, 204);
});

const GOOD_REPLY = JSON.stringify({
  recipes: [{
    name: "Cheesy Egg Scramble",
    ingredients: ["eggs", "cheese", "salt"],
    steps: ["Beat the eggs.", "Cook gently in a pan.", "Stir in the cheese."],
  }],
});

test("Worker retries a busy Gemini twice, then returns 503 busy", async () => {
  fakeGemini(geminiError(503, "UNAVAILABLE"));
  assert.deepEqual(await askWorker(), { status: 503, body: { error: "busy" } });
  assert.equal(geminiCalls, 3, "1 call + 2 retries");
});

test("Worker returns recipes when a retry after busy succeeds", async () => {
  fakeGemini(geminiError(503, "UNAVAILABLE"), geminiText(GOOD_REPLY));
  const { status, body } = await askWorker();
  assert.equal(status, 200);
  assert.deepEqual(body.recipes.map((r) => r.name), ["Cheesy Egg Scramble"]);
  assert.equal(geminiCalls, 2);
});

test("Worker returns 503 quota for Gemini's 429 without retrying", async () => {
  fakeGemini(geminiError(429, "RESOURCE_EXHAUSTED"));
  assert.deepEqual(await askWorker(), { status: 503, body: { error: "quota" } });
  assert.equal(geminiCalls, 1);
});

test("Worker returns 502 bad_reply for other Gemini errors without retrying", async () => {
  fakeGemini(geminiError(500, "INTERNAL"));
  assert.deepEqual(await askWorker(), { status: 502, body: { error: "bad_reply" } });
  assert.equal(geminiCalls, 1);
});
