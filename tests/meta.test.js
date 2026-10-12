import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, test } from "node:test";
import {
  DEFAULT_OPT_IN_COUNTRIES,
  consentModeForCountry,
  funnelPixelTag,
  nameParts,
  normalizeEmail,
  parseOptInCountries,
  readLeadMeta,
  sendLeadEvent,
} from "../dist/meta.js";

const originalFetch = globalThis.fetch;

function sha(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function capiConfig(overrides = {}) {
  return {
    metaPixelId: "1234567890",
    metaCapiAccessToken: "test-capi-token",
    metaGraphVersion: "v26.0",
    metaTestEventCode: "",
    ...overrides,
  };
}

function capiLead(overrides = {}) {
  return {
    marketingConsent: true,
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    email: "Ada@Example.com",
    name: "Ada Lovelace",
    ip: "203.0.113.10",
    userAgent: "TestAgent/1.0",
    fbp: "fb.1.1700000000000.111",
    fbc: "fb.1.1700000000000.IwAR123",
    ...overrides,
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("the default opt-in list is the EEA, GB and CH", () => {
  const countries = parseOptInCountries(undefined);
  assert.equal(countries.size, DEFAULT_OPT_IN_COUNTRIES.length);
  for (const code of ["SK", "DE", "IS", "NO", "LI", "GB", "CH"]) assert.equal(countries.has(code), true);
  assert.equal(countries.has("US"), false);
  assert.equal(parseOptInCountries("  ").size, DEFAULT_OPT_IN_COUNTRIES.length);
});

test("a custom country list replaces the default", () => {
  const countries = parseOptInCountries("us, sk, not-a-code");
  assert.deepEqual([...countries], ["US", "SK"]);
});

test("consent is opt-in for listed and unknown countries", () => {
  const countries = parseOptInCountries(undefined);
  assert.equal(consentModeForCountry("SK", countries), "opt_in");
  assert.equal(consentModeForCountry("gb", countries), "opt_in");
  assert.equal(consentModeForCountry(undefined, countries), "opt_in");
  assert.equal(consentModeForCountry("XX", countries), "opt_in");
  assert.equal(consentModeForCountry("US", countries), "opt_out");
  assert.equal(consentModeForCountry("T1", countries), "opt_out");
});

test("the pixel bootstrap only accepts a numeric id", () => {
  assert.equal(funnelPixelTag("123<script>", "opt_in"), null);
  assert.equal(funnelPixelTag("", "opt_in"), null);
  assert.equal(
    funnelPixelTag("1234567890", "opt_out"),
    '<script>window.FUNNEL_PIXEL={"pixelId":"1234567890","consentMode":"opt_out"};</script>',
  );
});

test("a name is split only when it is exactly two words", () => {
  assert.deepEqual(nameParts("  Ada   Lovelace "), { fn: "ada", ln: "lovelace" });
  assert.deepEqual(nameParts("Madonna"), { fn: "madonna" });
  assert.deepEqual(nameParts("Mary Ann Smith"), { fn: "mary ann smith" });
  assert.equal(normalizeEmail("  Ada@Example.com "), "ada@example.com");
});

test("attribution is trimmed and a bad value does not have to be valid", () => {
  const now = 1_700_000_000_000;
  const meta = readLeadMeta(
    {
      utm_source: `facebook${"x".repeat(300)}`,
      utm_medium: "   ",
      utm_campaign: 12,
      utm_content: "video_01",
      utm_term: "",
      fbclid: "IwAR123",
      fbclid_ts: now - 1000,
      fbp: "fb.1.1.1",
      fbc: "",
      event_id: "not-a-uuid",
      marketing_consent: "true",
    },
    now,
  );
  assert.equal(meta.utmSource.length, 200);
  assert.equal(meta.utmMedium, null);
  assert.equal(meta.utmCampaign, null);
  assert.equal(meta.utmContent, "video_01");
  assert.equal(meta.utmTerm, null);
  assert.equal(meta.fbc, `fb.1.${now - 1000}.IwAR123`);
  assert.equal(meta.eventId, null);
  assert.equal(meta.marketingConsent, false);
});

test("an existing fbc is kept and a future fbclid time is not composed", () => {
  const now = 1_700_000_000_000;
  const kept = readLeadMeta(
    { fbc: "fb.1.5.existing", fbclid: "IwAR123", fbclid_ts: now - 1000 },
    now,
  );
  assert.equal(kept.fbc, "fb.1.5.existing");
  const future = readLeadMeta({ fbc: "", fbclid: "IwAR123", fbclid_ts: now + 6 * 60 * 1000 }, now);
  assert.equal(future.fbc, null);
  assert.equal(future.fbclid, "IwAR123");
});

test("CAPI is skipped without consent, a token, or a uuid", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };
  await sendLeadEvent(capiConfig(), capiLead({ marketingConsent: false }));
  await sendLeadEvent(capiConfig({ metaCapiAccessToken: "" }), capiLead());
  await sendLeadEvent(capiConfig(), capiLead({ eventId: null }));
  assert.equal(called, false);
});

test("CAPI sends one Lead with hashed name parts and the same event id", async () => {
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, init };
    return new Response("{}", { status: 200 });
  };

  await sendLeadEvent(capiConfig({ metaTestEventCode: "TEST12345" }), capiLead());

  const url = new URL(captured.url);
  assert.equal(url.origin + url.pathname, "https://graph.facebook.com/v26.0/1234567890/events");
  assert.equal(url.searchParams.get("access_token"), "test-capi-token");
  const body = JSON.parse(captured.init.body);
  assert.equal(body.test_event_code, "TEST12345");
  assert.equal(body.data.length, 1);
  const event = body.data[0];
  assert.equal(event.event_name, "Lead");
  assert.equal(event.event_id, "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(event.action_source, "website");
  assert.equal(event.event_source_url, "https://enlightening.sk/software/contact/");
  assert.deepEqual(event.user_data.em, [sha("ada@example.com")]);
  assert.deepEqual(event.user_data.fn, [sha("ada")]);
  assert.deepEqual(event.user_data.ln, [sha("lovelace")]);
  assert.equal(event.user_data.client_ip_address, "203.0.113.10");
  assert.equal(event.user_data.client_user_agent, "TestAgent/1.0");
  assert.equal(event.user_data.fbp, "fb.1.1700000000000.111");
  assert.equal(event.user_data.fbc, "fb.1.1700000000000.IwAR123");
  assert.equal(JSON.stringify(body).includes("company"), false);
});

test("a one-word or three-word name is only fn", async () => {
  let body;
  globalThis.fetch = async (_url, init) => {
    body = JSON.parse(init.body);
    return new Response("{}", { status: 200 });
  };
  await sendLeadEvent(capiConfig(), capiLead({ name: "Mary Ann Smith", ip: "unknown", fbp: null, fbc: null }));
  assert.deepEqual(body.data[0].user_data.fn, [sha("mary ann smith")]);
  assert.equal(body.data[0].user_data.ln, undefined);
  assert.equal(body.data[0].user_data.client_ip_address, undefined);
  assert.equal(body.data[0].user_data.fbp, undefined);
  assert.equal(body.test_event_code, undefined);
});

test("a CAPI failure is reported without the access token", async () => {
  globalThis.fetch = async () => new Response("nope", { status: 400 });
  await assert.rejects(() => sendLeadEvent(capiConfig(), capiLead()), /CAPI responded 400/);

  globalThis.fetch = async () => {
    throw new Error("https://graph.facebook.com/events?access_token=test-capi-token failed");
  };
  await assert.rejects(() => sendLeadEvent(capiConfig(), capiLead()), (error) => {
    assert.equal(error.message, "CAPI request failed");
    assert.equal(error.message.includes("test-capi-token"), false);
    return true;
  });
});
