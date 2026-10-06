import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readReply } from "./reply.js";

// Saved sample replies from Claude, so no test calls the real API.
// They were all written for this pantry.
const PANTRY = ["eggs", "cheese", "spinach", "tomatoes"];

function loadReply(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/replies/${name}.json`, import.meta.url), "utf8"));
}

// The recipes written in a saved reply's text.
function recipesIn(name) {
  return JSON.parse(loadReply(name).content[0].text).recipes;
}

const BAD_REPLY = { status: 502, body: { error: "bad_reply" } };

// --- A good reply ---

test("a good reply gives 200 with all 3 recipes", () => {
  assert.deepEqual(readReply(loadReply("good"), PANTRY), {
    status: 200,
    body: { recipes: recipesIn("good") },
  });
});

// --- Broken formatting ---

test("text that isn't JSON gives 502 bad_reply", () => {
  assert.deepEqual(readReply(loadReply("broken-json"), PANTRY), BAD_REPLY);
});

test("a reply cut off at max_tokens gives 502 bad_reply", () => {
  assert.deepEqual(readReply(loadReply("cut-off"), PANTRY), BAD_REPLY);
});

test("a refusal gives 502 bad_reply even though its text is valid JSON", () => {
  assert.deepEqual(readReply(loadReply("refusal"), PANTRY), BAD_REPLY);
});

test("valid JSON in the wrong shape gives 200 with no recipes", () => {
  assert.deepEqual(readReply(loadReply("wrong-shape"), PANTRY), {
    status: 200,
    body: { recipes: [] },
  });
});

test("a reply with no text block gives 502 bad_reply", () => {
  const message = { ...loadReply("good"), content: [] };
  assert.deepEqual(readReply(message, PANTRY), BAD_REPLY);
});

test("something that isn't a reply at all gives 502 bad_reply", () => {
  for (const message of [null, undefined, "hi", {}, { stop_reason: "end_turn" }]) {
    assert.deepEqual(readReply(message, PANTRY), BAD_REPLY, `message was ${JSON.stringify(message)}`);
  }
});

// --- Missing fields ---

test("recipes with missing fields are dropped, the good one is kept", () => {
  const { status, body } = readReply(loadReply("missing-fields"), PANTRY);
  assert.equal(status, 200);
  assert.deepEqual(body.recipes.map((r) => r.name), ["Spinach Egg Cups"]);
});

// --- Ingredients you don't have ---

test("recipes that need ingredients you don't have are dropped", () => {
  const { status, body } = readReply(loadReply("off-pantry"), PANTRY);
  assert.equal(status, 200);
  assert.deepEqual(body.recipes.map((r) => r.name), ["Simple Tomato Salad"]);
});

test("the same reply keeps nothing when the pantry is different", () => {
  assert.deepEqual(readReply(loadReply("good"), ["rice"]), { status: 200, body: { recipes: [] } });
});

// --- Safety ---

test("readReply does not change the reply", () => {
  const message = loadReply("good");
  const before = structuredClone(message);
  readReply(message, PANTRY);
  assert.deepEqual(message, before);
});
