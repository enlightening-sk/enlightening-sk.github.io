import assert from "node:assert/strict";
import { after, test } from "node:test";

process.env.MYSQL_PORT = "1";
process.env.TURNSTILE_SKIP = "1";
process.env.RESEND_API_KEY = "re_invalid_test_key";

const { app } = await import("../dist/app.js");
const { pool } = await import("../dist/db.js");

after(async () => {
  await pool.end();
});

test("a database failure does not accept the lead", { timeout: 20_000 }, async () => {
  const response = await app.request("/api/lead", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.200",
    },
    body: JSON.stringify({
      help: "Not sure",
      project: "This insert should fail because the database is unreachable.",
      engagement: "Not sure yet",
      budget: "Not sure yet",
      start: "I'm exploring options",
      name: "Lead Test",
      email: "db-down@example.com",
      company_website: "",
      loadedAt: Date.now() - 10_000,
    }),
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { ok: false });
});
