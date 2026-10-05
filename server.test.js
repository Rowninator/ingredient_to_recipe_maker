import { test } from "node:test";
import assert from "node:assert/strict";
import { isHiddenPath } from "./server.js";

test("blocks dot folders and dot files", () => {
  assert.equal(isHiddenPath("/.git/config"), true);
  assert.equal(isHiddenPath("/.claude/settings.local.json"), true);
  assert.equal(isHiddenPath("/.gitignore"), true);
  assert.equal(isHiddenPath("/assets/.secret"), true);
});

test("allows the app's own files", () => {
  assert.equal(isHiddenPath("/"), false);
  assert.equal(isHiddenPath("/index.html"), false);
  assert.equal(isHiddenPath("/match.js"), false);
});

test("a dot inside a name is fine, only a leading dot is blocked", () => {
  assert.equal(isHiddenPath("/pantry.test.js"), false);
});
