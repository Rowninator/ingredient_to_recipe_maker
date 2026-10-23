import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

// Starts the real dev server (vite.config.js) on a free port and checks that
// files holding secrets or local data are refused. Denied files that don't
// exist would just fall back to index.html, so the test makes real ones in a
// throwaway folder (deny patterns match at any depth).
const root = fileURLToPath(new URL(".", import.meta.url));
const BASE = "/ingredient_to_recipe_maker/";
let server;
let origin;
let tmp;
const DENIED = [".dev.vars", ".dev.vars.local", ".env", "key.pem", ".claude/settings.json", ".wrangler/state.json"];

before(async () => {
  tmp = mkdtempSync(join(root, "deny-test-"));
  for (const file of DENIED) {
    mkdirSync(join(tmp, file, ".."), { recursive: true });
    writeFileSync(join(tmp, file), "SECRET=not-a-real-secret\n");
  }
  server = await createServer({ root, logLevel: "silent", server: { port: 0, strictPort: false } });
  await server.listen();
  origin = `http://localhost:${server.httpServer.address().port}`;
});

after(async () => {
  await server?.close();
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

async function get(path) {
  const response = await fetch(origin + BASE + path);
  return { status: response.status, text: await response.text() };
}

test("serves the app's own files", async () => {
  assert.equal((await get("match.js")).status, 200);
});

for (const file of DENIED) {
  test(`refuses ${file}`, async () => {
    const { status, text } = await get(`${basename(tmp)}/${file}`);
    assert.equal(status, 403);
    assert.ok(!text.includes("not-a-real-secret"));
  });
}

test("refuses the real .claude settings and .git", async () => {
  assert.equal((await get(".claude/settings.json")).status, 403);
  assert.equal((await get(".git/config")).status, 403);
});
