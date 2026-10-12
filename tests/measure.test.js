import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, test } from "node:test";

process.env.TURNSTILE_SKIP = "1";
process.env.RESEND_API_KEY = "re_invalid_test_key";
process.env.META_PIXEL_ID = "1234567890";
process.env.META_CAPI_ACCESS_TOKEN = "test-capi-token";
process.env.META_GRAPH_VERSION = "v26.0";
process.env.META_TEST_EVENT_CODE = "TEST12345";

const { app } = await import("../dist/app.js");
const { pool } = await import("../dist/db.js");

after(async () => {
  await pool.end();
});

const originalFetch = globalThis.fetch;
let serial = 0;

function nextIp() {
  serial += 1;
  return `203.0.113.${serial}`;
}

function nextEmail() {
  serial += 1;
  return `measure-${process.pid}-${serial}@example.com`;
}

function brief(overrides = {}) {
  return {
    help: "Not sure",
    project: "A short project description.",
    engagement: "Not sure yet",
    budget: "Not sure yet",
    start: "I'm exploring options",
    name: "Ada Lovelace",
    email: "measure@example.com",
    company_website: "",
    loadedAt: Date.now() - 10_000,
    ...overrides,
  };
}

function post(ip, payload, userAgent = "MeasureTest/1.0") {
  return app.request("/api/lead", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": ip,
      "user-agent": userAgent,
    },
    body: JSON.stringify(payload),
  });
}

test("a consented submit stores attribution and sends one CAPI Lead", async () => {
  const email = nextEmail();
  const ip = nextIp();
  const eventId = "550e8400-e29b-41d4-a716-446655440000";
  const seen = Date.now() - 60_000;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: init?.body });
    return new Response("{}", { status: 200 });
  };

  try {
    const response = await post(ip, brief({
      email,
      marketing_consent: true,
      event_id: eventId,
      fbp: "fb.1.1700000000000.111",
      fbc: "",
      fbclid: "IwAR123",
      fbclid_ts: seen,
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "legacy",
      utm_content: "video_01",
      utm_term: "reports",
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });

    const [rows] = await pool.query("SELECT * FROM leads WHERE email = ?", [email]);
    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(row.utm_source, "facebook");
    assert.equal(row.utm_medium, "paid");
    assert.equal(row.utm_campaign, "legacy");
    assert.equal(row.utm_content, "video_01");
    assert.equal(row.utm_term, "reports");
    assert.equal(row.fbclid, "IwAR123");
    assert.equal(row.fbp, "fb.1.1700000000000.111");
    assert.equal(row.fbc, `fb.1.${seen}.IwAR123`);
    assert.equal(row.meta_event_id, eventId);
    assert.equal(Number(row.marketing_consent), 1);
    assert.equal(row.status, "new");
    assert.equal(row.qualified, null);
    assert.equal(JSON.stringify(row).includes(ip), false);
    const emailHash = createHash("sha256").update(email.trim().toLowerCase(), "utf8").digest("hex");
    assert.equal(JSON.stringify(row).includes(emailHash), false);

    const capi = calls.filter((call) => call.url.startsWith("https://graph.facebook.com/"));
    assert.equal(capi.length, 1);
    const payload = JSON.parse(capi[0].body);
    assert.equal(payload.data[0].event_name, "Lead");
    assert.equal(payload.data[0].event_id, eventId);
    assert.equal(payload.test_event_code, "TEST12345");
    assert.equal(payload.data[0].user_data.client_ip_address, ip);
  } finally {
    globalThis.fetch = originalFetch;
    await pool.execute("DELETE FROM leads WHERE email = ?", [email]);
  }
});

test("a submit without marketing consent is stored and does not call CAPI", async () => {
  const email = nextEmail();
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    return new Response("{}", { status: 200, headers: init ? {} : {} });
  };
  try {
    const response = await post(nextIp(), brief({
      email,
      marketing_consent: false,
      event_id: "550e8400-e29b-41d4-a716-446655440001",
      utm_source: "facebook",
      fbclid: "IwAR999",
    }));
    assert.equal(response.status, 200);
    const [rows] = await pool.query(
      "SELECT utm_source, fbclid, marketing_consent, meta_event_id FROM leads WHERE email = ?",
      [email],
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].utm_source, "facebook");
    assert.equal(rows[0].fbclid, "IwAR999");
    assert.equal(Number(rows[0].marketing_consent), 0);
    assert.equal(rows[0].meta_event_id, "550e8400-e29b-41d4-a716-446655440001");
    assert.equal(calls.some((url) => url.includes("graph.facebook.com")), false);
  } finally {
    globalThis.fetch = originalFetch;
    await pool.execute("DELETE FROM leads WHERE email = ?", [email]);
  }
});

test("a CAPI outage still stores the lead and returns success", async () => {
  const email = nextEmail();
  globalThis.fetch = async (url) => {
    if (String(url).includes("graph.facebook.com")) return new Response("down", { status: 500 });
    return new Response("{}", { status: 200 });
  };
  try {
    const response = await post(nextIp(), brief({
      email,
      marketing_consent: true,
      event_id: "550e8400-e29b-41d4-a716-446655440002",
    }));
    assert.equal(response.status, 200);
    const [rows] = await pool.query("SELECT COUNT(*) AS n FROM leads WHERE email = ?", [email]);
    assert.equal(Number(rows[0].n), 1);
  } finally {
    globalThis.fetch = originalFetch;
    await pool.execute("DELETE FROM leads WHERE email = ?", [email]);
  }
});

test("a long or invalid attribution value still stores the brief", async () => {
  const email = nextEmail();
  globalThis.fetch = async () => new Response("{}", { status: 200 });
  try {
    const response = await post(nextIp(), brief({
      email,
      utm_source: "x".repeat(500),
      event_id: "not-a-uuid",
      marketing_consent: "yes",
      fbclid: { bad: true },
    }));
    assert.equal(response.status, 200);
    const [rows] = await pool.query(
      "SELECT utm_source, fbclid, meta_event_id, marketing_consent FROM leads WHERE email = ?",
      [email],
    );
    assert.equal(rows[0].utm_source.length, 200);
    assert.equal(rows[0].fbclid, null);
    assert.equal(rows[0].meta_event_id, null);
    assert.equal(Number(rows[0].marketing_consent), 0);
  } finally {
    globalThis.fetch = originalFetch;
    await pool.execute("DELETE FROM leads WHERE email = ?", [email]);
  }
});
