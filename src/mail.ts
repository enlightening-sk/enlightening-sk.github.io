import type { Env } from "./env.js";
import type { StoredLead } from "./db.js";

function fromAddress(name: string, email: string): string {
  const safeName = name.replace(/[\r\n<>"]/g, "").trim();
  return `${safeName} <${email.trim()}>`;
}

function briefText(lead: StoredLead): string {
  return [
    "New project brief",
    "",
    `Help: ${lead.help}`,
    "",
    "Project:",
    lead.project,
    "",
    `Engagement: ${lead.engagement}`,
    `Budget: ${lead.budget}`,
    `Start: ${lead.start}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company ?? "(not provided)"}`,
  ].join("\n");
}

export async function notifyLead(env: Env, lead: StoredLead): Promise<void> {
  if (!env.resendApiKey || !env.resendFromEmail || !env.resendFromName) {
    throw new Error("Resend is not configured");
  }

  const subjectName = lead.name.replace(/[\r\n]+/g, " ").slice(0, 120);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(env.resendFromName, env.resendFromEmail),
      to: [env.resendFromEmail],
      reply_to: lead.email,
      subject: `Project brief from ${subjectName}`,
      text: briefText(lead),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").trim().slice(0, 300);
    throw new Error(`Resend responded ${response.status}${detail ? `: ${detail}` : ""}`);
  }
}
