import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { build } from "vite";

// Builds the site and the app (vite.config.js) into throwaway folders and
// checks the privacy policy is a built page in both: Pages only serves the
// built site, and the app links to its own copy (ANDROID.md step 8).
const root = fileURLToPath(new URL(".", import.meta.url));

async function buildMode(mode) {
  const outDir = mkdtempSync(join(tmpdir(), `pm-build-${mode}-`));
  await build({ root, mode, logLevel: "silent", build: { outDir, emptyOutDir: true } });
  return outDir;
}

for (const [mode, base] of [["production", "/ingredient_to_recipe_maker/"], ["android", "/"]]) {
  test(`the ${mode} build includes the privacy page with its styles`, async () => {
    const outDir = await buildMode(mode);
    try {
      assert.ok(existsSync(join(outDir, "index.html")), "index.html is built");
      const page = readFileSync(join(outDir, "privacy.html"), "utf8");
      assert.match(page, /<h1>Privacy policy<\/h1>/);
      assert.match(page, new RegExp(`href="${base}assets/theme-[^"]+\\.css"`), "theme.css is bundled under the right base");
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
}

test("the privacy page has a real contact email, not the placeholder", () => {
  const page = readFileSync(join(root, "privacy.html"), "utf8");
  assert.doesNotMatch(page, /TO-FILL/);
  assert.match(page, /href="mailto:[^"@\s]+@[^"\s]+\.[a-z]{2,}"/i);
});
