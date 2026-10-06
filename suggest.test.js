import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, checkSuggestions, BASICS } from "./suggest.js";

// The text between <pantry> and </pantry> in the user message.
function pantryPart(prompt) {
  const match = prompt.user.match(/<pantry>([\s\S]*)<\/pantry>/);
  assert.ok(match, "user text should contain <pantry>...</pantry>");
  return match[1];
}

// A recipe that passes every check for PANTRY.
const PANTRY = ["eggs", "cheese", "spinach"];
function goodRecipe(extra = {}) {
  return {
    name: "Cheesy Egg Scramble",
    ingredients: ["eggs", "cheese", "salt"],
    steps: ["Beat the eggs.", "Cook gently in a pan.", "Stir in the cheese."],
    ...extra,
  };
}

// --- buildPrompt ---

test("buildPrompt returns system and user strings", () => {
  const prompt = buildPrompt(["eggs", "cheese"]);
  assert.equal(typeof prompt.system, "string");
  assert.equal(typeof prompt.user, "string");
});

test("buildPrompt puts the pantry inside the <pantry> markers", () => {
  const inside = pantryPart(buildPrompt(["eggs", "cheese"]));
  assert.ok(inside.includes("eggs"));
  assert.ok(inside.includes("cheese"));
});

test("buildPrompt keeps the pantry out of the system text", () => {
  assert.ok(!buildPrompt(["zucchini"]).system.includes("zucchini"));
});

test("buildPrompt trims items and drops blanks and duplicates", () => {
  const inside = pantryPart(buildPrompt(["  eggs ", "", "   ", "Eggs", "egg", "cheese"]));
  assert.ok(inside.includes("eggs"));
  assert.ok(!inside.includes("  eggs "));
  assert.ok(inside.includes("cheese"));
  assert.equal(inside.toLowerCase().split("egg").length - 1, 1, "eggs should appear once");
});

test("buildPrompt keeps at most 40 items", () => {
  const items = [];
  for (let i = 1; i <= 50; i++) items.push("item" + String(i).padStart(2, "0"));
  const inside = pantryPart(buildPrompt(items));
  assert.ok(inside.includes("item01"));
  assert.ok(inside.includes("item40"));
  assert.ok(!inside.includes("item41"));
});

test("buildPrompt returns null for an empty or blank pantry", () => {
  assert.equal(buildPrompt([]), null);
  assert.equal(buildPrompt(["", "   "]), null);
});

test("buildPrompt's system text mentions the basics and the 3-recipe limit", () => {
  const { system } = buildPrompt(["eggs"]);
  for (const basic of BASICS) assert.ok(system.includes(basic), `missing ${basic}`);
  assert.match(system, /\b3\b|three/i);
});

test("buildPrompt's system text says to ignore instructions in the pantry", () => {
  assert.match(buildPrompt(["eggs"]).system, /instruction/i);
});

test("buildPrompt does not change its input", () => {
  const items = ["  eggs ", "", "eggs", "cheese"];
  buildPrompt(items);
  assert.deepEqual(items, ["  eggs ", "", "eggs", "cheese"]);
});

// --- checkSuggestions: shape of data ---

test("checkSuggestions keeps a valid recipe", () => {
  assert.deepEqual(checkSuggestions({ recipes: [goodRecipe()] }, PANTRY), [goodRecipe()]);
});

test("checkSuggestions returns [] for data that isn't an object with a recipes array", () => {
  for (const data of [null, undefined, "recipes", 42, {}, { recipes: "eggs" }, { recipes: null }]) {
    assert.deepEqual(checkSuggestions(data, PANTRY), [], `data was ${JSON.stringify(data)}`);
  }
});

test("checkSuggestions skips entries that aren't objects", () => {
  const data = { recipes: [null, "Scramble", 7, goodRecipe()] };
  assert.deepEqual(checkSuggestions(data, PANTRY), [goodRecipe()]);
});

// --- checkSuggestions: ingredients ---

test("checkSuggestions drops a recipe with an ingredient not in the pantry", () => {
  const data = { recipes: [goodRecipe({ ingredients: ["eggs", "bacon"] })] };
  assert.deepEqual(checkSuggestions(data, PANTRY), []);
});

test("checkSuggestions accepts basics and plural forms", () => {
  const recipe = goodRecipe({ ingredients: ["egg", "Cheese", "salt", "pepper", "oil", "water"] });
  assert.deepEqual(checkSuggestions({ recipes: [recipe] }, PANTRY), [recipe]);
});

test("checkSuggestions needs 2 to 12 ingredients", () => {
  const big = [];
  for (let i = 1; i <= 13; i++) big.push("food" + String(i).padStart(2, "0"));
  const check = (ingredients) => checkSuggestions({ recipes: [goodRecipe({ ingredients })] }, big).length;
  assert.equal(check(["food01"]), 0, "1 ingredient");
  assert.equal(check(big.slice(0, 2)), 1, "2 ingredients");
  assert.equal(check(big.slice(0, 12)), 1, "12 ingredients");
  assert.equal(check(big), 0, "13 ingredients");
});

test("checkSuggestions drops blank, non-text or missing ingredients", () => {
  for (const ingredients of [["eggs", "  "], ["eggs", 7], "eggs, cheese", undefined]) {
    const data = { recipes: [goodRecipe({ ingredients })] };
    assert.deepEqual(checkSuggestions(data, PANTRY), [], `ingredients were ${JSON.stringify(ingredients)}`);
  }
});

// --- checkSuggestions: name ---

test("checkSuggestions needs a non-blank name of at most 60 characters", () => {
  const check = (name) => checkSuggestions({ recipes: [goodRecipe({ name })] }, PANTRY).length;
  assert.equal(check("a".repeat(60)), 1, "60 characters");
  assert.equal(check("a".repeat(61)), 0, "61 characters");
  assert.equal(check("   "), 0, "blank");
  assert.equal(check(42), 0, "not text");
  assert.equal(check(undefined), 0, "missing");
});

// --- checkSuggestions: steps ---

test("checkSuggestions needs 3 to 6 steps", () => {
  const check = (count) => {
    const steps = Array.from({ length: count }, (_, i) => `Step ${i + 1}.`);
    return checkSuggestions({ recipes: [goodRecipe({ steps })] }, PANTRY).length;
  };
  assert.equal(check(2), 0, "2 steps");
  assert.equal(check(3), 1, "3 steps");
  assert.equal(check(6), 1, "6 steps");
  assert.equal(check(7), 0, "7 steps");
});

test("checkSuggestions needs each step to be non-blank text of at most 200 characters", () => {
  const check = (last) => {
    const steps = ["Beat the eggs.", "Cook gently.", last];
    return checkSuggestions({ recipes: [goodRecipe({ steps })] }, PANTRY).length;
  };
  assert.equal(check("a".repeat(200)), 1, "200 characters");
  assert.equal(check("a".repeat(201)), 0, "201 characters");
  assert.equal(check("  "), 0, "blank");
  assert.equal(check(null), 0, "not text");
});

// --- checkSuggestions: the result ---

test("checkSuggestions keeps at most 3 recipes, in order", () => {
  const recipes = [1, 2, 3, 4, 5].map((n) => goodRecipe({ name: `Recipe ${n}` }));
  const names = checkSuggestions({ recipes }, PANTRY).map((r) => r.name);
  assert.deepEqual(names, ["Recipe 1", "Recipe 2", "Recipe 3"]);
});

test("checkSuggestions keeps the good recipes when some are bad", () => {
  const recipes = [goodRecipe({ name: "" }), goodRecipe({ name: "Good one" }), goodRecipe({ steps: [] })];
  assert.deepEqual(checkSuggestions({ recipes }, PANTRY), [goodRecipe({ name: "Good one" })]);
});

test("checkSuggestions trims every string", () => {
  const recipe = {
    name: "  Cheesy Egg Scramble ",
    ingredients: [" eggs", "cheese  ", " salt "],
    steps: ["  Beat the eggs.", "Cook gently in a pan.  ", " Stir in the cheese. "],
  };
  assert.deepEqual(checkSuggestions({ recipes: [recipe] }, PANTRY), [goodRecipe()]);
});

test("checkSuggestions leaves out extra fields", () => {
  const data = { recipes: [goodRecipe({ calories: 300, html: "<img src=x>" })], note: "hi" };
  assert.deepEqual(checkSuggestions(data, PANTRY), [goodRecipe()]);
});

test("checkSuggestions does not change its input", () => {
  const data = { recipes: [goodRecipe({ name: "  Padded " }), goodRecipe({ name: "" })] };
  const before = structuredClone(data);
  checkSuggestions(data, PANTRY);
  assert.deepEqual(data, before);
});
