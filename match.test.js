import { test } from "node:test";
import assert from "node:assert/strict";
import { matchRecipes } from "./match.js";
import { recipes } from "./recipes.js";

// Small recipe lists keep each test easy to read.
const toast = { name: "Toast", ingredients: ["bread", "butter"] };
const omelette = { name: "Omelette", ingredients: ["eggs", "cheese", "butter"] };
const salad = { name: "Salad", ingredients: ["tomatoes", "cucumber", "olive oil"] };
const pasta = { name: "Pasta", ingredients: ["pasta", "tomatoes", "garlic"] };

const names = (result) => result.map((r) => r.name);

// --- Basic matching ---

test("returns a recipe that uses one of your ingredients", () => {
  assert.deepEqual(names(matchRecipes(["bread"], [toast, salad])), ["Toast"]);
});

test("returns the recipe objects themselves", () => {
  assert.deepEqual(matchRecipes(["bread"], [toast]), [toast]);
});

test("ranks recipes by how many of your ingredients they use", () => {
  // Omelette uses 3 (eggs, cheese, butter), Toast uses 1 (butter).
  const result = matchRecipes(["butter", "eggs", "cheese"], [toast, omelette]);
  assert.deepEqual(names(result), ["Omelette", "Toast"]);
});

test("returns at most 3 recipes", () => {
  const many = [
    { name: "A", ingredients: ["salt"] },
    { name: "B", ingredients: ["salt"] },
    { name: "C", ingredients: ["salt"] },
    { name: "D", ingredients: ["salt"] },
  ];
  assert.equal(matchRecipes(["salt"], many).length, 3);
});

test("keeps original list order when match counts tie", () => {
  const result = matchRecipes(["tomatoes"], [salad, pasta]);
  assert.deepEqual(names(result), ["Salad", "Pasta"]);
});

test("a higher count beats a recipe that comes earlier in the list", () => {
  // Salad appears first but uses 1; Pasta uses 2.
  const result = matchRecipes(["tomatoes", "garlic"], [salad, pasta]);
  assert.deepEqual(names(result), ["Pasta", "Salad"]);
});

// --- No match / empty input ---

test("returns fewer than 3 when fewer recipes match", () => {
  assert.equal(matchRecipes(["garlic"], [toast, salad, pasta]).length, 1);
});

test("returns an empty list when nothing matches", () => {
  assert.deepEqual(matchRecipes(["chocolate"], [toast, salad]), []);
});

test("returns an empty list when you have no ingredients", () => {
  assert.deepEqual(matchRecipes([], [toast, salad]), []);
});

test("ignores blank ingredients", () => {
  assert.deepEqual(matchRecipes(["", "   "], [toast, salad]), []);
});

// --- Case and spaces ---

test("ignores upper/lower case", () => {
  assert.deepEqual(names(matchRecipes(["BrEaD"], [toast])), ["Toast"]);
});

test("ignores spaces at the start and end", () => {
  assert.deepEqual(names(matchRecipes(["  bread  "], [toast])), ["Toast"]);
});

test("treats several spaces inside a name as one", () => {
  assert.deepEqual(names(matchRecipes(["olive    oil"], [salad])), ["Salad"]);
});

// --- Singular vs. plural ---

test("singular input matches a plural recipe ingredient (egg -> eggs)", () => {
  assert.deepEqual(names(matchRecipes(["egg"], [omelette])), ["Omelette"]);
});

test("plural input matches a singular recipe ingredient (breads -> bread)", () => {
  assert.deepEqual(names(matchRecipes(["breads"], [toast])), ["Toast"]);
});

test("handles -es plurals (tomato -> tomatoes)", () => {
  assert.deepEqual(names(matchRecipes(["tomato"], [salad])), ["Salad"]);
});

test("combines case, spaces and plurals", () => {
  assert.deepEqual(names(matchRecipes(["  EGG "], [omelette])), ["Omelette"]);
});

test("does not match unrelated words that share letters", () => {
  // "pea" should not match "pear"; "oil" should not match "olive oil".
  const pear = { name: "Pear Tart", ingredients: ["pear"] };
  assert.deepEqual(matchRecipes(["pea", "oil"], [pear, salad]), []);
});

// --- Counting fairly ---

test("listing the same ingredient twice does not count it twice", () => {
  const eggCup = { name: "Egg Cup", ingredients: ["eggs", "salt"] };
  // Correct: both score 1, tie keeps list order. Counting "butter" twice would put Toast first.
  const result = matchRecipes(["butter", "butter", "eggs"], [eggCup, toast]);
  assert.deepEqual(names(result), ["Egg Cup", "Toast"]);
});

test("egg and eggs together still count as one ingredient", () => {
  const boiled = { name: "Boiled Egg", ingredients: ["eggs"] };
  const cheeseToast = { name: "Cheese Toast", ingredients: ["bread", "cheese"] };
  // Correct: Boiled Egg 1, Cheese Toast 2. Counting egg + eggs twice would make it a tie.
  const result = matchRecipes(["egg", "eggs", "bread", "cheese"], [boiled, cheeseToast]);
  assert.deepEqual(names(result), ["Cheese Toast", "Boiled Egg"]);
});

// --- Safety ---

test("does not change the recipes list you pass in", () => {
  const list = [toast, omelette];
  matchRecipes(["eggs", "cheese"], list);
  assert.deepEqual(names(list), ["Toast", "Omelette"]);
});

// --- Real data ---

test("works with the real recipe list", () => {
  const result = matchRecipes(["egg", "Butter", "  cheese"], recipes);
  // Cheese Omelette uses all 3. Several recipes tie at 2; the first two in the list win.
  assert.deepEqual(names(result), ["Cheese Omelette", "Scrambled Eggs", "Pancakes"]);
});
