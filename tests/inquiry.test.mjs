import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/inquiry.mjs";
import {
  validateInquiry,
  validCoordinates,
  approvedMedia,
} from "../src/shared.js";
const valid = {
  name: "Adult Learner",
  email: "learner@example.com",
  phone: "",
  type: "lesson-inquiry",
  service: "piano",
  age: "adult",
  message: "I would like to ask about lessons.",
  privacy: false,
  website: "",
};
const req = (v = valid, origin = "https://studio.test") =>
  new Request("https://studio.test/.netlify/functions/inquiry", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(v),
  });
test("query/form validation enforces values, bounds, email and lesson interest", () => {
  assert.deepEqual(validateInquiry(valid), {});
  for (const value of [
    { ...valid, type: "injected" },
    { ...valid, service: "other" },
    { ...valid, service: "" },
    { ...valid, age: "bad" },
    { ...valid, email: "not-email" },
    { ...valid, name: "x".repeat(101) },
  ])
    assert.ok(Object.keys(validateInquiry(value)).length);
});
test("coordinates and publication permission fail closed", () => {
  assert.equal(validCoordinates(null), false);
  assert.equal(validCoordinates([181, 0]), false);
  assert.equal(validCoordinates([0, 0]), true);
  assert.equal(
    approvedMedia([{ src: "a", alt: "Photo", publicationPermission: false }])
      .length,
    0,
  );
});
test("Facebook link is optional and validates provided URLs", () => {
  assert.deepEqual(validateInquiry({ ...valid, facebook: "" }), {});
  assert.deepEqual(validateInquiry({ ...valid, facebook: "https://www.facebook.com/example" }), {});
  for (const facebook of ["https://example.com", "https://facebook.com.evil.test", "javascript:alert(1)", 123])
    assert.ok(validateInquiry({ ...valid, facebook }).facebook);
});
test("function gracefully rejects missing configuration", async () => {
  const old = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.equal((await handler(req())).status, 503);
  if (old) process.env.RESEND_API_KEY = old;
});
test("server validates submission, safe text email and provider acceptance without Turnstile", async () => {
  const original = { ...process.env };
  const nativeFetch = global.fetch;
  Object.assign(process.env, {
    RESEND_API_KEY: "re_test",
    CONTACT_FROM_EMAIL: "studio@test.example",
    CONTACT_TO_EMAIL: "owner@test.example",
    CONTACT_ALLOWED_ORIGIN: "https://studio.test",
  });
  let accept = true, email;
  global.fetch = async (url, options) => {
    assert.ok(String(url).startsWith("https://api.resend.com/"));
    email = JSON.parse(options.body);
    return accept
      ? Response.json({ id: "test-id" })
      : Response.json(
          { name: "validation_error", message: "private provider detail" },
          { status: 422 },
        );
  };
  try {
    assert.equal(
      (await handler(req({ ...valid, website: "spam" }))).status,
      400,
    );
    assert.equal((await handler(req(valid, "https://bad.test"))).status, 403);
    assert.equal(
      (await handler(req({ ...valid, phone: "x".repeat(41) }))).status,
      400,
    );
    assert.equal(
      (await handler(req({ ...valid, message: "x".repeat(17000) }))).status,
      413,
    );
    assert.equal(
      (await handler(req({ ...valid, message: "<script>alert(1)</script>" })))
        .status,
      200,
    );
    assert.ok(email.text.includes("<script>"));
    assert.ok(email.html.includes("&lt;script&gt;"));
    assert.ok(!email.html.includes("<script>"));
    assert.ok(email.html.includes("Visitor details"));
    assert.ok(email.html.includes("Piano lessons"));
    assert.ok(email.html.includes("Not provided"));
    assert.equal(email.reply_to, valid.email);
    assert.equal((await handler(req({ ...valid, facebook: "https://www.facebook.com/example" }))).status, 200);
    assert.ok(email.text.includes("Facebook profile: https://www.facebook.com/example"));
    assert.ok(email.html.includes("https://www.facebook.com/example"));
    assert.equal(
      Array.isArray(email.to) ? email.to[0] : email.to,
      "owner@test.example",
    );
    delete process.env.CONTACT_TO_EMAIL;
    assert.equal((await handler(req())).status, 200);
    assert.equal(
      Array.isArray(email.to) ? email.to[0] : email.to,
      "the.musicnook12@gmail.com",
    );
    assert.equal(email.reply_to, valid.email);
    accept = false;
    const fail = await handler(req());
    assert.equal(fail.status, 502);
    assert.equal((await fail.json()).code, "error");
  } finally {
    global.fetch = nativeFetch;
    for (const key of Object.keys(process.env))
      if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});
