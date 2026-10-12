import assert from "node:assert/strict";
import { after, test } from "node:test";

process.env.TURNSTILE_SKIP = "1";
process.env.RESEND_API_KEY = "re_invalid_test_key";
process.env.META_PIXEL_ID = "1234567890";
process.env.META_CAPI_ACCESS_TOKEN = "";
process.env.META_TEST_EVENT_CODE = "";

const { app } = await import("../dist/app.js");
const { pool } = await import("../dist/db.js");

after(async () => {
  await pool.end();
});

const originalFetch = globalThis.fetch;

test("a missing CAPI token still stores the lead and returns success", async () => {
  const email = `capi-missing-${process.pid}@example.com`;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response("{}", { status: 200 });
  };
  try {
    const response = await app.request("/api/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.250",
      },
      body: JSON.stringify({
        help: "Not sure",
        project: "Storage should succeed when Conversions API is not configured.",
        engagement: "Not sure yet",
        budget: "Not sure yet",
        start: "I'm exploring options",
        name: "Ada Lovelace",
        email,
        company_website: "",
        loadedAt: Date.now() - 10_000,
        marketing_consent: true,
        event_id: "550e8400-e29b-41d4-a716-446655440009",
      }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    const [rows] = await pool.query("SELECT COUNT(*) AS n FROM leads WHERE email = ?", [email]);
    assert.equal(Number(rows[0].n), 1);
    assert.equal(calls.some((url) => url.includes("graph.facebook.com")), false);
  } finally {
    globalThis.fetch = originalFetch;
    await pool.execute("DELETE FROM leads WHERE email = ?", [email]);
  }
});
