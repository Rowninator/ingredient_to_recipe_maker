import { test } from "node:test";
import assert from "node:assert/strict";
import { savePantry, loadPantry, PANTRY_KEY } from "./pantry.js";

// A tiny stand-in for the browser's localStorage: it only stores strings,
// and getItem returns null for a key that was never set.
function fakeStorage(start = {}) {
  const data = new Map(Object.entries(start));
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

// Storage that refuses to work, like a full or blocked localStorage.
const brokenStorage = {
  getItem() {
    throw new Error("storage blocked");
  },
  setItem() {
    throw new Error("storage full");
  },
};

// --- Items persist ---

test("save then load gives back the same list", () => {
  const storage = fakeStorage();
  savePantry(storage, ["eggs", "cheese", "olive oil"]);
  assert.deepEqual(loadPantry(storage), ["eggs", "cheese", "olive oil"]);
});

test("savePantry returns true when it saves", () => {
  assert.equal(savePantry(fakeStorage(), ["eggs"]), true);
});

test("saves under the pantry-match:pantry key as JSON text", () => {
  const storage = fakeStorage();
  savePantry(storage, ["eggs", "cheese"]);
  assert.equal(PANTRY_KEY, "pantry-match:pantry");
  assert.equal(storage.data.get("pantry-match:pantry"), '["eggs","cheese"]');
});

test("loads a list that was saved earlier (e.g. on a previous visit)", () => {
  const storage = fakeStorage({ "pantry-match:pantry": '["bread","butter"]' });
  assert.deepEqual(loadPantry(storage), ["bread", "butter"]);
});

test("does not change the list you pass in", () => {
  const items = ["eggs", "cheese"];
  savePantry(fakeStorage(), items);
  assert.deepEqual(items, ["eggs", "cheese"]);
});

// --- No duplicates ---

test("saving twice replaces the old list instead of adding to it", () => {
  const storage = fakeStorage();
  savePantry(storage, ["eggs", "cheese"]);
  savePantry(storage, ["eggs", "cheese"]);
  assert.deepEqual(loadPantry(storage), ["eggs", "cheese"]);
});

test("saving a bigger list keeps each item once", () => {
  const storage = fakeStorage();
  savePantry(storage, ["eggs"]);
  savePantry(storage, ["eggs", "milk"]);
  assert.deepEqual(loadPantry(storage), ["eggs", "milk"]);
});

// --- Removing an item ---

test("an item removed and saved stays removed after loading", () => {
  const storage = fakeStorage();
  savePantry(storage, ["eggs", "cheese", "milk"]);
  savePantry(storage, ["eggs", "milk"]);
  assert.deepEqual(loadPantry(storage), ["eggs", "milk"]);
});

test("removing the last item leaves an empty pantry", () => {
  const storage = fakeStorage();
  savePantry(storage, ["eggs"]);
  savePantry(storage, []);
  assert.deepEqual(loadPantry(storage), []);
});

// --- Empty or missing pantry ---

test("an empty pantry saves and loads as []", () => {
  const storage = fakeStorage();
  assert.equal(savePantry(storage, []), true);
  assert.deepEqual(loadPantry(storage), []);
});

test("nothing saved yet loads as []", () => {
  assert.deepEqual(loadPantry(fakeStorage()), []);
});

test("broken saved text loads as []", () => {
  const storage = fakeStorage({ "pantry-match:pantry": "[eggs, chee" });
  assert.deepEqual(loadPantry(storage), []);
});

test("a saved value that isn't a list loads as []", () => {
  for (const text of ['"eggs"', '{"eggs":true}', "42", "null"]) {
    const storage = fakeStorage({ "pantry-match:pantry": text });
    assert.deepEqual(loadPantry(storage), [], `saved text was ${text}`);
  }
});

test("drops blank and non-text entries and trims names", () => {
  const storage = fakeStorage({
    "pantry-match:pantry": '["  eggs ", "", "   ", 7, null, {"a":1}, "milk"]',
  });
  assert.deepEqual(loadPantry(storage), ["eggs", "milk"]);
});

// --- Storage missing or blocked ---

test("no storage at all: load gives [] and save gives false", () => {
  assert.deepEqual(loadPantry(null), []);
  assert.equal(savePantry(null, ["eggs"]), false);
});

test("storage that throws: load gives [] and save gives false", () => {
  assert.deepEqual(loadPantry(brokenStorage), []);
  assert.equal(savePantry(brokenStorage, ["eggs"]), false);
});
