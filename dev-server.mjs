import http from "node:http";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const target = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.normalize(path.join(root, target));

  if (!file.startsWith(root) || !existsSync(file)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(response);
});

server.listen(port, () => {
  console.log(`유베스트영어 preview: http://localhost:${port}`);
});
