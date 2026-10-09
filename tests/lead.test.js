import assert from "node:assert/strict";
import { after, test } from "node:test";

process.env.TURNSTILE_SKIP = "1";
process.env.RESEND_API_KEY = "re_invalid_test_key";

const { app } = await import("../dist/app.js");
const { pool } = await import("../dist/db.js");

after(async () => {
  await pool.end();
});

let serial = 0;

function nextIp() {
  serial += 1;
  return `203.0.113.${serial}`;
}

function nextEmail() {
  serial += 1;
  return `lead-test-${process.pid}-${serial}@example.com`;
}

function brief(overrides = {}) {
  return {
    help: "Not sure",
    project: "A short project description.",
    engagement: "Not sure yet",
    budget: "Not sure yet",
    start: "I'm exploring options",
    name: "Lead Test",
    email: "lead-test@example.com",
    company_website: "",
    loadedAt: Date.now() - 10_000,
    ...overrides,
  };
}

function post(ip, payload) {
  return app.request("/api/lead", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify(payload),
  });
}

async function leadCount(email) {
  const [rows] = await pool.query("SELECT COUNT(*) AS n FROM leads WHERE email = ?", [email]);
  return Number(rows[0].n);
}

async function rejected(overrides, status) {
  const email = nextEmail();
  const response = await post(nextIp(), brief({ email, ...overrides }));
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), { ok: false });
  assert.equal(await leadCount(email), 0);
}

test("an unknown choice does not create a lead", async () => {
  await rejected({ help: "Anything else" }, 400);
});

test("an empty project does not create a lead", async () => {
  await rejected({ project: "   " }, 400);
});

test("a filled honeypot does not create a lead", async () => {
  await rejected({ company_website: "https://spam.example" }, 403);
});

test("a submission faster than three seconds does not create a lead", async () => {
  await rejected({ loadedAt: Date.now() }, 400);
});

test("a timestamp from the future does not create a lead", async () => {
  await rejected({ loadedAt: Date.now() + 6 * 60 * 1000 }, 400);
});

test("a timestamp older than a day does not create a lead", async () => {
  await rejected({ loadedAt: Date.now() - 25 * 60 * 60 * 1000 }, 400);
});

test("the sixth attempt in an hour does not create a lead", async () => {
  const ip = nextIp();
  const email = nextEmail();
  const statuses = [];
  for (let i = 0; i < 6; i += 1) {
    const response = await post(ip, brief({ email, project: "" }));
    statuses.push(response.status);
  }
  assert.deepEqual(statuses, [400, 400, 400, 400, 400, 429]);
  assert.equal(await leadCount(email), 0);
});

test("a Resend failure still stores the lead and returns success", async () => {
  const email = nextEmail();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("rejected", { status: 500 });
  try {
    const response = await post(nextIp(), brief({ email, project: "Mail failure should not block storage." }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(await leadCount(email), 1);
  } finally {
    globalThis.fetch = originalFetch;
    await pool.execute("DELETE FROM leads WHERE email = ?", [email]);
  }
});
