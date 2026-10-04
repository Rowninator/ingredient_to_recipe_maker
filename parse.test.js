import { test } from "node:test";
import assert from "node:assert/strict";
import { parseIngredients } from "./parse.js";

test("splits on commas and trims each part", () => {
  assert.deepEqual(parseIngredients(" egg,cheese ,  milk "), ["egg", "cheese", "milk"]);
});

test("drops empty parts", () => {
  assert.deepEqual(parseIngredients("egg,, ,cheese,"), ["egg", "cheese"]);
});

test("returns an empty list for blank text", () => {
  assert.deepEqual(parseIngredients("   "), []);
});

test("keeps multi-word ingredients together", () => {
  assert.deepEqual(parseIngredients("olive oil, soy sauce"), ["olive oil", "soy sauce"]);
});
