import { type NonSharedBuffer } from "node:buffer";
import { realpath, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Context } from "hono";
import { getEnv } from "./env.js";
import { consentModeForCountry, funnelPixelTag } from "./meta.js";

const root = path.resolve(import.meta.dirname, "..");

const ROOT_FILES = new Set(["index.html", "robots.txt", "sitemap.xml", "CNAME"]);
const PUBLIC_PREFIXES = ["software/", "privacy/"];
const PUBLIC_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
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

const FUNNEL_HTML = new Set([
  "software/index.html",
  "software/contact/index.html",
  "software/thanks/index.html",
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
    case ".js":
      return "text/javascript; charset=utf-8";
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

function injectFunnelPixel(html: string, country: string | undefined): string | null {
  const env = getEnv();
  if (!env.metaPixelId) return null;
  const tag = funnelPixelTag(
    env.metaPixelId,
    consentModeForCountry(country, env.metaOptInCountries),
  );
  if (!tag) return null;
  const marker = "</head>";
  const at = html.indexOf(marker);
  if (at < 0) return null;
  return `${html.slice(0, at)}${tag}\n${html.slice(at)}`;
}

async function fileResponse(
  rel: string,
  method: string,
  country: string | undefined,
): Promise<Response | null> {
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

  const funnel = FUNNEL_HTML.has(realRel);
  let body: NonSharedBuffer | null = null;
  let length = info.size;
  let cache = cacheControl(realRel);
  if (method !== "HEAD" || funnel) {
    const file = await readFile(realFile);
    body = file;
    length = file.byteLength;
    if (funnel) {
      const html = injectFunnelPixel(file.toString("utf8"), country);
      if (html !== null) {
        body = Buffer.from(html, "utf8");
        length = body.byteLength;
        cache = "private, no-cache";
      }
    }
  }
  if (method === "HEAD") body = null;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType(realRel),
      "content-length": String(length),
      "cache-control": cache,
      "x-content-type-options": "nosniff",
    },
  });
}

export async function servePublic(c: Context): Promise<Response> {
  const pathname = safePathname(new URL(c.req.url).pathname);
  if (!pathname) return c.text("Bad request", 400);
  const country = c.req.header("cf-ipcountry");

  const rel = pathname.slice(1);
  if (pathname.endsWith("/") || rel === "") {
    const indexRel = rel === "" ? "index.html" : `${rel}index.html`;
    const response = await fileResponse(indexRel, c.req.method, country);
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

  const response = await fileResponse(rel, c.req.method, country);
  return response ?? c.text("Not found", 404);
}
