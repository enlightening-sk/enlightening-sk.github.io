import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { notifyLead } from "../dist/mail.js";

const originalFetch = globalThis.fetch;

const lead = {
  help: "Build a product",
  project: "A short brief.",
  engagement: "10–20 hours",
  budget: "$2,000–$5,000",
  start: "Within a few weeks",
  name: "Ada\nLovelace",
  email: "ada@example.com",
  company: null,
};

function configured(overrides = {}) {
  return {
    resendApiKey: "re_test",
    resendFromEmail: "michal@enlightening.sk",
    resendFromName: 'Michal " - Enlightening.sk',
    ...overrides,
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("notifyLead refuses to send when Resend settings are missing", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };

  await assert.rejects(() => notifyLead(configured({ resendApiKey: "" }), lead), /not configured/);
  await assert.rejects(() => notifyLead(configured({ resendFromEmail: "" }), lead), /not configured/);
  await assert.rejects(() => notifyLead(configured({ resendFromName: "" }), lead), /not configured/);
  assert.equal(called, false);
});

test("notifyLead posts the brief from the configured sender to the same inbox", async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, init };
    return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
  };

  await notifyLead(configured(), lead);

  assert.equal(captured.url, "https://api.resend.com/emails");
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers.authorization, "Bearer re_test");
  const body = JSON.parse(captured.init.body);
  assert.equal(body.from, "Michal  - Enlightening.sk <michal@enlightening.sk>");
  assert.deepEqual(body.to, ["michal@enlightening.sk"]);
  assert.equal(body.reply_to, "ada@example.com");
  assert.equal(body.subject, "Project brief from Ada Lovelace");
  assert.match(body.text, /Help: Build a product/);
  assert.match(body.text, /Email: ada@example.com/);
  assert.match(body.text, /Company: \(not provided\)/);
});

test("notifyLead reports the Resend status when the API rejects the message", async () => {
  globalThis.fetch = async () => new Response("domain is not verified", { status: 403 });

  await assert.rejects(
    () => notifyLead(configured(), lead),
    /Resend responded 403: domain is not verified/,
  );
});
