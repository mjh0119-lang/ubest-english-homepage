import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const serverDir = path.join(dist, "server");

await rm(dist, { recursive: true, force: true });
await mkdir(serverDir, { recursive: true });
await cp(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });

for (const file of ["index.html", "styles.css", "script.js"]) {
  await cp(path.join(root, file), path.join(dist, file));
}

if (existsSync(path.join(root, ".openai"))) {
  await cp(path.join(root, ".openai"), path.join(dist, ".openai"), { recursive: true });
}

const worker = `
const ASSET_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let key = url.pathname === "/" ? "/index.html" : url.pathname;
    key = key.replace(/^\\//, "");
    const asset = await getAsset(key);
    if (!asset) {
      return new Response("Not found", { status: 404 });
    }
    const ext = key.slice(key.lastIndexOf("."));
    return new Response(asset, {
      headers: {
        "content-type": ASSET_TYPES[ext] || "application/octet-stream",
        "cache-control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable"
      }
    });
  }
};

async function getAsset(key) {
  const assets = {
    "index.html": ${JSON.stringify(await readFile(path.join(root, "index.html"), "utf8"))},
    "styles.css": ${JSON.stringify(await readFile(path.join(root, "styles.css"), "utf8"))},
    "script.js": ${JSON.stringify(await readFile(path.join(root, "script.js"), "utf8"))}
  };
  return assets[key] || null;
}
`;

await writeFile(path.join(serverDir, "index.js"), worker.trimStart());
