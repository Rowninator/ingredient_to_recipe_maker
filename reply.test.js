import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readReply } from "./reply.js";

// Saved sample reply texts, so no test calls the real API.
// They were all written for this pantry.
const PANTRY = ["eggs", "cheese", "spinach", "tomatoes"];

function loadReply(name) {
  return readFileSync(new URL(`./fixtures/replies/${name}.txt`, import.meta.url), "utf8");
}

// The recipes written in a saved reply.
function recipesIn(name) {
  return JSON.parse(loadReply(name)).recipes;
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

test("a reply that stops halfway gives 502 bad_reply", () => {
  assert.deepEqual(readReply(loadReply("cut-off"), PANTRY), BAD_REPLY);
});

test("valid JSON in the wrong shape gives 200 with no recipes", () => {
  assert.deepEqual(readReply(loadReply("wrong-shape"), PANTRY), {
    status: 200,
    body: { recipes: [] },
  });
});

test("empty text gives 502 bad_reply", () => {
  assert.deepEqual(readReply("", PANTRY), BAD_REPLY);
});

test("something that isn't text gives 502 bad_reply", () => {
  for (const text of [null, undefined, 42, {}, { recipes: [] }]) {
    assert.deepEqual(readReply(text, PANTRY), BAD_REPLY, `text was ${JSON.stringify(text)}`);
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

test("a bad reply never echoes the AI's text", () => {
  const { body } = readReply(loadReply("broken-json"), PANTRY);
  assert.ok(!JSON.stringify(body).includes("Spinach"));
});
