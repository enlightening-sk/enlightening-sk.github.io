import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";

process.env.META_PIXEL_ID = "1234567890";
process.env.META_OPT_IN_COUNTRIES = "SK,DE,GB,CH";
process.env.META_CAPI_ACCESS_TOKEN = "";

const { app } = await import("../dist/app.js");
const { pool } = await import("../dist/db.js");

after(async () => {
  await pool.end();
});

function page(file) {
  return readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

test("funnel html in git has no pixel id", () => {
  for (const file of [
    "index.html",
    "privacy/index.html",
    "software/index.html",
    "software/contact/index.html",
    "software/thanks/index.html",
    "software/measure.js",
  ]) {
    const text = page(file);
    assert.equal(text.includes("1234567890"), false, file);
    assert.equal(text.includes("META_CAPI"), false, file);
    assert.equal(text.includes("fbq('init'"), false, file);
  }
  assert.equal(page("index.html").includes("measure.js"), false);
  assert.equal(page("privacy/index.html").includes("measure.js"), false);
  assert.equal(page("software/thanks/index.html").includes('"Lead"'), false);
});

test("measure.js records the visit and fires Lead only from funnelTrackLead", () => {
  const js = page("software/measure.js");
  assert.equal(js.includes("Tell me about your project"), false);
  assert.match(js, /function startPixel\(\) \{[\s\S]*?"PageView"[\s\S]*?"ViewContent"[\s\S]*?\n  \}/);
  const start = js.slice(js.indexOf("function startPixel"), js.indexOf("function removeBanner"));
  assert.equal(start.includes('"Lead"'), false);
  assert.match(js, /window\.funnelTrackLead = function \(eventId\) \{[\s\S]*?"Lead"/);
  assert.match(js, /fbclid_ts = prev\.fbclid_ts/);
  assert.match(js, /Max-Age=" \+ maxAge/);
});

test("the contact page fires Lead only after a successful submit", () => {
  const html = page("software/contact/index.html");
  const script = html.slice(html.lastIndexOf("<script>"));
  const rejected = script.indexOf("if (!response.ok) throw new Error");
  const lead = script.indexOf("window.funnelTrackLead(eventId)");
  const thanks = script.indexOf('location.href = "/software/thanks/"');
  assert.ok(rejected !== -1 && lead !== -1 && thanks !== -1);
  assert.ok(rejected < lead && lead < thanks);
  assert.match(script, /data\.marketing_consent === true/);
  assert.match(script, /data\.event_id = eventId/);
  assert.match(html, /src="\/software\/measure\.js"/);
});

test("privacy describes Meta measurement and keeps the existing notice", () => {
  const html = page("privacy/index.html");
  assert.match(html, /We store the form fields you submit, the time you sent them, a hash of your IP address, and your browser's user agent\./);
  assert.match(html, /24 months from the day you send it/);
  assert.match(html, /emailed to michal@enlightening\.sk through Resend/);
  assert.match(html, /utm_source, utm_medium, utm_campaign, utm_content and utm_term/);
  assert.match(html, /fbclid/);
  assert.match(html, /Meta Pixel and the Conversions API are used to measure advertising/);
  assert.match(html, /SHA-256 hash of your email and name/);
  assert.match(html, /_fbp and _fbc/);
  assert.match(html, /nothing is sent to Meta/);
});

async function htmlOf(path, country) {
  const response = await app.request(path, {
    headers: country ? { "cf-ipcountry": country } : {},
  });
  assert.equal(response.status, 200, path);
  return { response, html: await response.text() };
}

test("the server injects consent mode only on the three funnel pages", async () => {
  const us = await htmlOf("/software/", "US");
  assert.match(us.html, /window\.FUNNEL_PIXEL=\{"pixelId":"1234567890","consentMode":"opt_out"\}/);
  assert.equal(us.response.headers.get("cache-control"), "private, no-cache");

  const sk = await htmlOf("/software/contact/", "SK");
  assert.match(sk.html, /"consentMode":"opt_in"/);
  const unknown = await htmlOf("/software/thanks/", undefined);
  assert.match(unknown.html, /"consentMode":"opt_in"/);

  const home = await htmlOf("/", "US");
  assert.equal(home.html.includes("FUNNEL_PIXEL"), false);
  assert.equal(home.response.headers.get("cache-control"), "no-cache");
  const privacy = await htmlOf("/privacy/", "US");
  assert.equal(privacy.html.includes("FUNNEL_PIXEL"), false);
  assert.equal(privacy.html.includes("1234567890"), false);
});

test("measure.js is public and source files stay private", async () => {
  const script = await app.request("/software/measure.js");
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
  const source = await app.request("/src/meta.ts");
  assert.equal(source.status, 404);
});
