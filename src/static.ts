import { realpath, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Context } from "hono";

const root = path.resolve(import.meta.dirname, "..");

const ROOT_FILES = new Set(["index.html", "robots.txt", "sitemap.xml", "CNAME"]);
const PUBLIC_PREFIXES = ["software/", "privacy/"];
const PUBLIC_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".ico",
  ".txt",
  ".xml",
  ".webmanifest",
]);

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function safePathname(raw: string): string | null {
  if (raw.includes("\\") || raw.includes("\0")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (decoded.includes("\\") || decoded.includes("\0")) return null;
  if (decoded.split("/").some((part) => part === "..")) return null;
  const normalized = path.posix.normalize(decoded);
  if (!normalized.startsWith("/")) return null;
  return normalized;
}

function hasDotSegment(rel: string): boolean {
  return rel.split("/").some((part) => part.startsWith("."));
}

function isPublicFile(rel: string): boolean {
  if (!rel || hasDotSegment(rel) || rel.endsWith(".map")) return false;
  if (ROOT_FILES.has(rel)) return true;
  if (!PUBLIC_PREFIXES.some((prefix) => rel.startsWith(prefix))) return false;
  return PUBLIC_EXTENSIONS.has(path.posix.extname(rel).toLowerCase());
}

function isPublicDir(rel: string): boolean {
  if (hasDotSegment(rel)) return false;
  const posix = rel.endsWith("/") ? rel.slice(0, -1) : rel;
  return posix === "software" || posix.startsWith("software/") || posix === "privacy" || posix.startsWith("privacy/");
}

function contentType(rel: string): string {
  switch (path.posix.extname(rel).toLowerCase()) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".xml":
      return "application/xml; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".webmanifest":
      return "application/manifest+json";
    default:
      return "text/plain; charset=utf-8";
  }
}

function cacheControl(rel: string): string {
  return rel.endsWith(".html") ? "no-cache" : "public, max-age=86400";
}

async function fileResponse(rel: string, method: string): Promise<Response | null> {
  if (!isPublicFile(rel)) return null;
  const abs = path.resolve(root, rel);
  if (!isInside(root, abs)) return null;

  let realFile: string;
  let realRoot: string;
  try {
    realFile = await realpath(abs);
    realRoot = await realpath(root);
  } catch {
    return null;
  }
  if (!isInside(realRoot, realFile)) return null;
  const realRel = path.relative(realRoot, realFile).split(path.sep).join("/");
  if (!isPublicFile(realRel)) return null;

  const info = await stat(realFile);
  if (!info.isFile()) return null;
  const body = method === "HEAD" ? null : await readFile(realFile);
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType(realRel),
      "content-length": String(info.size),
      "cache-control": cacheControl(realRel),
      "x-content-type-options": "nosniff",
    },
  });
}

export async function servePublic(c: Context): Promise<Response> {
  const pathname = safePathname(new URL(c.req.url).pathname);
  if (!pathname) return c.text("Bad request", 400);

  const rel = pathname.slice(1);
  if (pathname.endsWith("/") || rel === "") {
    const indexRel = rel === "" ? "index.html" : `${rel}index.html`;
    const response = await fileResponse(indexRel, c.req.method);
    return response ?? c.text("Not found", 404);
  }

  const abs = path.resolve(root, rel);
  if (!isInside(root, abs)) return c.text("Not found", 404);

  try {
    const info = await stat(abs);
    if (info.isDirectory()) {
      if (!isPublicDir(rel)) return c.text("Not found", 404);
      return c.redirect(`${pathname}/`, 301);
    }
  } catch {
    return c.text("Not found", 404);
  }

  const response = await fileResponse(rel, c.req.method);
  return response ?? c.text("Not found", 404);
}
