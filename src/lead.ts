import { createHash } from "node:crypto";
import type { Context } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
import { getEnv } from "./env.js";
import {
  countRecentAttempts,
  insertAttempt,
  insertLead,
  type StoredLead,
} from "./db.js";
import { notifyLead } from "./mail.js";
import { verifyTurnstile } from "./turnstile.js";

const MAX_BODY = 65_536;
const THREE_SECONDS = 3_000;
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const INVALID = Symbol("invalid");

const HELP = new Set([
  "Existing software / fixing a problem",
  "Backend development",
  "AI / LLM integration",
  "System / API integration",
  "New application / custom software",
  "MVP / product development",
  "Not sure",
  "Other",
]);

const ENGAGEMENT = new Set([
  "A few hours for a specific problem",
  "10–20 hours",
  "20–40 hours",
  "Ongoing development",
  "Not sure yet",
]);

const BUDGET = new Set([
  "Under $2,000",
  "$2,000–$5,000",
  "$5,000–$10,000",
  "$10,000+",
  "Not sure yet",
]);

const START = new Set([
  "As soon as possible",
  "Within a few weeks",
  "Within 1–3 months",
  "I'm exploring options",
]);

function fail(c: Context, status: 400 | 403 | 429 | 500): Response {
  return c.json({ ok: false }, status, { "cache-control": "no-store" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clientIp(c: Context): string {
  const cf = c.req.header("cf-connecting-ip")?.trim();
  if (cf && cf.length <= 64 && !/[\s,]/.test(cf)) return cf;
  try {
    const address = getConnInfo(c).remote.address?.trim();
    if (address && address.length <= 64 && !/[\s,]/.test(address)) return address;
  } catch {
    // Direct socket info is missing when the request did not come through Node's server.
  }
  return "unknown";
}

function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(ip, "utf8").update(salt, "utf8").digest("hex");
}

function honeypotTripped(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value !== "string") return true;
  return value.trim() !== "";
}

function timingOk(value: unknown, now: number): boolean {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return false;
  const elapsed = now - value;
  if (elapsed < THREE_SECONDS) return false;
  if (value > now + FIVE_MINUTES) return false;
  if (elapsed > ONE_DAY) return false;
  return true;
}

function oneOf(value: unknown, allowed: Set<string>): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return allowed.has(trimmed) ? trimmed : null;
}

function trimmedText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > max) return null;
  return trimmed;
}

function emailOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > 200) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

function companyOf(value: unknown): string | null | typeof INVALID {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return INVALID;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 200) return INVALID;
  return trimmed;
}

function validateLead(body: Record<string, unknown>): StoredLead | null {
  const help = oneOf(body.help, HELP);
  const project = trimmedText(body.project, 8000);
  const engagement = oneOf(body.engagement, ENGAGEMENT);
  const budget = oneOf(body.budget, BUDGET);
  const start = oneOf(body.start, START);
  const name = trimmedText(body.name, 200);
  const email = emailOf(body.email);
  const company = companyOf(body.company);
  if (!help || !project || !engagement || !budget || !start || !name || !email) return null;
  if (company === INVALID) return null;
  return { help, project, engagement, budget, start, name, email, company };
}

function userAgentOf(c: Context): string | null {
  const agent = c.req.header("user-agent");
  if (!agent) return null;
  return agent.slice(0, 300);
}

function dbError(error: unknown): string {
  return error instanceof Error ? error.message : "database error";
}

export async function handleLead(c: Context): Promise<Response> {
  const env = getEnv();
  const declared = c.req.header("content-length");
  if (declared === "0") return fail(c, 400);

  const ip = clientIp(c);
  const ipHash = hashIp(ip, env.ipHashSalt);

  if (declared && Number(declared) > MAX_BODY) {
    try {
      await insertAttempt(ipHash);
    } catch (error) {
      console.error(dbError(error));
      return fail(c, 500);
    }
    return fail(c, 400);
  }

  const raw = await c.req.text();
  if (raw.length === 0) return fail(c, 400);

  try {
    await insertAttempt(ipHash);
  } catch (error) {
    console.error(dbError(error));
    return fail(c, 500);
  }

  if (raw.length > MAX_BODY) return fail(c, 400);

  const contentType = (c.req.header("content-type") ?? "").toLowerCase();
  if (!contentType.startsWith("application/json")) return fail(c, 400);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail(c, 400);
  }
  if (!isRecord(parsed)) return fail(c, 400);

  if (honeypotTripped(parsed.company_website)) return fail(c, 403);
  if (!timingOk(parsed.loadedAt, Date.now())) return fail(c, 400);

  if (!env.turnstileSkip) {
    const passed = await verifyTurnstile(parsed["cf-turnstile-response"], ip, env.turnstileSecret);
    if (!passed) return fail(c, 403);
  }

  let attempts: number;
  try {
    attempts = await countRecentAttempts(ipHash);
  } catch (error) {
    console.error(dbError(error));
    return fail(c, 500);
  }
  if (attempts > 5) return fail(c, 429);

  const lead = validateLead(parsed);
  if (!lead) return fail(c, 400);

  let id: number;
  try {
    id = await insertLead(lead, ipHash, userAgentOf(c));
  } catch (error) {
    console.error(dbError(error));
    return fail(c, 500);
  }

  try {
    await notifyLead(env, lead);
  } catch (error) {
    console.error(`lead notify failed for ${id}: ${error instanceof Error ? error.message : "mail error"}`);
  }

  return c.json({ ok: true }, 200, { "cache-control": "no-store" });
}
