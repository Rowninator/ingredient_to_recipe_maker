import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrastRatio } from "./contrast.js";

// Reads the colour variables from theme.css: light from the first `:root {`
// block, dark from the `:root.md {` block inside the dark-mode media query.
const css = readFileSync(new URL("./theme.css", import.meta.url), "utf8");

function block(selector) {
  const start = css.indexOf(selector + " {");
  assert.ok(start !== -1, `theme.css has no "${selector} {" block`);
  const body = css.slice(start + selector.length + 2, css.indexOf("}", start));
  const vars = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[name] = value.trim();
  return vars;
}

const light = block(":root");
const darkOnly = block(":root.md");
const dark = { ...light, ...darkOnly };
const modes = { light, dark };

// [foreground, background, minimum ratio, what it is]
// Not checked (decorative): card and chip borders, the logo.
const TEXT = 4.5;
const NON_TEXT = 3;
const PAIRS = [
  ["--pm-title", "--pm-header-bg", TEXT, "app title"],
  ["--pm-text", "--pm-bg", TEXT, "headings on the page"],
  ["--pm-text", "--pm-surface", TEXT, "card titles"],
  ["--pm-text-2", "--pm-surface", TEXT, "body text on cards"],
  ["--pm-text-2", "--pm-bg", TEXT, "body text on the page"],
  ["--pm-muted", "--pm-bg", TEXT, "hint, Gemini note"],
  ["--pm-muted", "--pm-surface", TEXT, "Missing:, time, input placeholder"],
  ["--pm-muted-green", "--pm-bg", TEXT, "Saved on this device (text and icon)"],
  ["--pm-muted-green", "--pm-surface", TEXT, "AI suggestion label"],
  ["--pm-count", "--pm-surface", TEXT, "3 of 4 ingredients"],
  ["--pm-link", "--pm-bg", TEXT, "Clear all"],
  ["--pm-on-primary", "--pm-primary", TEXT, "button text"],
  ["--pm-chip-text", "--pm-chip-bg", TEXT, "chip text"],
  ["--pm-step-num", "--pm-step-bg", TEXT, "AI step number"],
  ["--pm-note-text", "--pm-note-bg", TEXT, "info/busy note"],
  ["--pm-error-text", "--pm-error-bg", TEXT, "save-error note (text and icon)"],
  ["--ion-text-color", "--ion-background-color", TEXT, "Ionic default text"],
  ["--ion-color-primary-contrast", "--ion-color-primary", TEXT, "Ionic primary button text"],
  ["--pm-chip-icon", "--pm-chip-bg", NON_TEXT, "chip remove icon"],
  ["--pm-input-border", "--pm-bg", NON_TEXT, "input border against the page"],
  ["--pm-input-border", "--pm-surface", NON_TEXT, "input border against the input"],
];

for (const [mode, vars] of Object.entries(modes)) {
  for (const [fg, bg, min, what] of PAIRS) {
    test(`${mode}: ${what} (${fg} on ${bg}) is at least ${min}:1`, () => {
      assert.ok(vars[fg], `${fg} is missing in ${mode}`);
      assert.ok(vars[bg], `${bg} is missing in ${mode}`);
      const ratio = contrastRatio(vars[fg], vars[bg]);
      assert.ok(ratio >= min, `${vars[fg]} on ${vars[bg]} is ${ratio.toFixed(2)}:1`);
    });
  }
}

test("dark mode redefines every light colour, so no light colour leaks into dark", () => {
  const colours = Object.keys(light).filter((n) => /^#/.test(light[n]));
  const missing = colours.filter((n) => !(n in darkOnly));
  assert.deepEqual(missing, []);
});

test("every colour is #rrggbb", () => {
  for (const [mode, vars] of Object.entries(modes)) {
    for (const [name, value] of Object.entries(vars)) {
      if (value.startsWith("#")) assert.match(value, /^#[0-9a-f]{6}$/i, `${mode} ${name}`);
    }
  }
});

test("each Ionic -rgb variable matches its colour", () => {
  for (const [mode, vars] of Object.entries(modes)) {
    for (const [name, value] of Object.entries(vars)) {
      if (!name.endsWith("-rgb")) continue;
      const hex = vars[name.slice(0, -4)];
      const expected = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
      assert.equal(value, expected, `${mode} ${name}`);
    }
  }
});
