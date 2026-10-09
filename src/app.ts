import { Hono } from "hono";
import { handleLead } from "./lead.js";
import { servePublic } from "./static.js";

export const app = new Hono();

app.post("/api/lead", (c) => handleLead(c));
app.on(["GET", "HEAD"], "*", (c) => servePublic(c));
app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) return c.json({ ok: false }, 404);
  return c.text("Not found", 404);
});
app.onError((error, c) => {
  console.error(error instanceof Error ? error.message : error);
  if (c.req.path.startsWith("/api/")) return c.json({ ok: false }, 500);
  return c.text("Server error", 500);
});
