// PostToolUse hook: after Claude edits a code file in this project, run the
// tests that cover it (the Worker's for worker/, otherwise the top-level ones).
// Docs and files outside the project don't trigger a run. On failure, the last
// 40 lines go to Claude and exit code 2 marks the edit as needing a fix.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const CODE = new Set([".js", ".mjs", ".css", ".html", ".json", ".jsonc"]);

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const file = input.tool_input?.file_path;
if (!file) process.exit(0);

const rel = relative(root, file);
if (rel.startsWith("..") || isAbsolute(rel) || !CODE.has(extname(file))) process.exit(0);

const inWorker = rel.split(sep)[0] === "worker";
const cwd = inWorker ? join(root, "worker") : root;
if (inWorker && !existsSync(join(cwd, "node_modules"))) process.exit(0);

const run = spawnSync("npm test", { cwd, shell: true, encoding: "utf8" });
if (run.status !== 0) {
  const out = `${run.stdout ?? ""}${run.stderr ?? ""}${run.error?.message ?? ""}`;
  process.stderr.write(`${inWorker ? "worker " : ""}npm test failed:\n${out.trimEnd().split("\n").slice(-40).join("\n")}\n`);
  process.exit(2);
}
