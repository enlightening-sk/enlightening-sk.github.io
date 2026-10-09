import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";

const { app } = await import("../dist/app.js");
const { pool } = await import("../dist/db.js");

after(async () => {
  await pool.end();
});

test("private files are not served", async () => {
  for (const path of ["/docs/software-funnel-implementation.md", "/docs/", "/.env", "/src/lead.ts"]) {
    const response = await app.request(path);
    assert.equal(response.status, 404, path);
    const text = await response.text();
    assert.equal(text, "Not found");
    assert.equal(text.includes("RESEND_API_KEY"), false);
  }
});

test("the contact page is served", async () => {
  const response = await app.request("/software/contact/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Send my project/);
});

test("a failed submit stays on the form and enables the button again", () => {
  const html = readFileSync(new URL("../software/contact/index.html", import.meta.url), "utf8");
  const script = html.slice(html.lastIndexOf("<script>"));
  const rejected = script.indexOf("if (!response.ok) throw new Error");
  const thanks = script.indexOf('location.href = "/software/thanks/"');
  const enabled = script.indexOf("submit.disabled = false");
  assert.ok(rejected !== -1 && thanks !== -1 && enabled !== -1);
  assert.ok(rejected < thanks);
  assert.ok(thanks < enabled);
  assert.match(script, /error\.hidden = false/);
});
