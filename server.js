// Tiny static file server so the browser can load ES modules. Run: npm start
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

// True for paths like "/.git/config" or "/.claude/x.json": dot folders and files are never served.
export function isHiddenPath(path) {
  return path.split("/").some((part) => part.startsWith("."));
}

// Only start the server when run directly (npm start), not when a test imports this file.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    if (isHiddenPath(path)) return res.writeHead(403).end();
    const file = normalize(join(ROOT, path === "/" ? "index.html" : path));
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": (TYPES[extname(file)] || "text/plain") + "; charset=utf-8" });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  }).listen(PORT, "127.0.0.1", () => console.log(`Open http://localhost:${PORT}`));
}
