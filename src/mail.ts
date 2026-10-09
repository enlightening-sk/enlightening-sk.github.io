import type { Env } from "./env.js";
import type { StoredLead } from "./db.js";

const FROM = "enlightening.sk <info@enlightening.sk>";

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
  if (!env.resendApiKey || !env.leadNotifyEmail) {
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
      from: FROM,
      to: [env.leadNotifyEmail],
      reply_to: lead.email,
      subject: `Project brief from ${subjectName}`,
      text: briefText(lead),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error(`Resend responded ${response.status}`);
}
