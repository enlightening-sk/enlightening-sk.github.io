import mysql from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getEnv } from "./env.js";

const env = getEnv();

export const pool = mysql.createPool({
  host: env.mysqlHost,
  port: env.mysqlPort,
  user: env.mysqlUser,
  password: env.mysqlPassword,
  database: env.mysqlDatabase,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  enableKeepAlive: true,
});

export async function insertAttempt(ipHash: string): Promise<void> {
  await pool.execute("INSERT INTO lead_attempts (ip_hash) VALUES (?)", [ipHash]);
}

export async function countRecentAttempts(ipHash: string): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM lead_attempts WHERE ip_hash = ? AND created_at >= (NOW() - INTERVAL 1 HOUR)",
    [ipHash],
  );
  const count = Number(rows[0]?.n ?? 0);
  return Number.isFinite(count) ? count : 0;
}

export type StoredLead = {
  help: string;
  project: string;
  engagement: string;
  budget: string;
  start: string;
  name: string;
  email: string;
  company: string | null;
};

export async function insertLead(
  lead: StoredLead,
  ipHash: string,
  userAgent: string | null,
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO leads
      (help, project, engagement, budget, start_when, name, email, company, status, ip_hash, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    [
      lead.help,
      lead.project,
      lead.engagement,
      lead.budget,
      lead.start,
      lead.name,
      lead.email,
      lead.company,
      ipHash,
      userAgent,
    ],
  );
  return result.insertId;
}
