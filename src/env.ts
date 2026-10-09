import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type Env = {
  host: string;
  port: number;
  nodeEnv: string;
  mysqlHost: string;
  mysqlPort: number;
  mysqlUser: string;
  mysqlPassword: string;
  mysqlDatabase: string;
  resendApiKey: string;
  leadNotifyEmail: string;
  turnstileSecret: string;
  turnstileSkip: boolean;
  ipHashSalt: string;
};

const root = path.resolve(import.meta.dirname, "..");

function loadDotEnv(): void {
  const file = path.join(root, ".env");
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function requireValue(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    console.error(`${name} is required`);
    process.exit(1);
  }
  return value;
}

function requirePort(name: string, fallback: string): number {
  const raw = process.env[name] || fallback;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`${name} must be an integer from 1 to 65535`);
    process.exit(1);
  }
  return port;
}

loadDotEnv();

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;

  const nodeEnv = process.env.NODE_ENV || "development";
  const skipAsked = process.env.TURNSTILE_SKIP === "1";
  if (skipAsked && nodeEnv === "production") {
    console.error("TURNSTILE_SKIP is ignored when NODE_ENV=production");
  }
  const turnstileSecret = process.env.TURNSTILE_SECRET ?? "";
  if (nodeEnv === "production" && turnstileSecret === "") {
    console.error("TURNSTILE_SECRET is required when NODE_ENV=production");
    process.exit(1);
  }

  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  const leadNotifyEmail = process.env.LEAD_NOTIFY_EMAIL ?? "";
  if (!resendApiKey || !leadNotifyEmail) {
    console.error(
      "RESEND_API_KEY or LEAD_NOTIFY_EMAIL is missing; lead email will fail without blocking storage",
    );
  }

  cached = {
    host: process.env.HOST || "127.0.0.1",
    port: requirePort("PORT", "3000"),
    nodeEnv,
    mysqlHost: requireValue("MYSQL_HOST"),
    mysqlPort: requirePort("MYSQL_PORT", "3306"),
    mysqlUser: requireValue("MYSQL_USER"),
    mysqlPassword: process.env.MYSQL_PASSWORD ?? "",
    mysqlDatabase: requireValue("MYSQL_DATABASE"),
    resendApiKey,
    leadNotifyEmail,
    turnstileSecret,
    turnstileSkip: skipAsked && nodeEnv !== "production",
    ipHashSalt: requireValue("IP_HASH_SALT"),
  };
  return cached;
}
