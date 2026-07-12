import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 4174);
const types = { ".css": "text/css", ".html": "text/html", ".ico": "image/x-icon", ".js": "application/javascript", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };

function contentType(file) {
  if (/\.jpe?g(?:-w=\d+)?$/i.test(file)) return "image/jpeg";
  if (/\.png(?:-w=\d+)?$/i.test(file)) return "image/png";
  if (/\.webp(?:-w=\d+)?$/i.test(file)) return "image/webp";
  return types[path.extname(file).toLowerCase()] || "application/octet-stream";
}

const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = path.resolve(root, relative);
  if (!candidate.startsWith(`${root}${path.sep}`) && candidate !== root) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  let file = candidate;
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    await stat(file);
    response.writeHead(200, { "Content-Type": contentType(file) });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

server.listen(port, () => console.log(`Preview available at http://localhost:${port}/collection-preview/`));
