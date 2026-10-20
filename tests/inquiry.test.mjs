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
  token: "valid-token",
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
test("function gracefully rejects missing configuration", async () => {
  const old = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.equal((await handler(req())).status, 503);
  if (old) process.env.RESEND_API_KEY = old;
});
test("server validates challenge, submission, safe text email and provider acceptance", async () => {
  const original = { ...process.env };
  const nativeFetch = global.fetch;
  Object.assign(process.env, {
    RESEND_API_KEY: "re_test",
    CONTACT_FROM_EMAIL: "studio@test.example",
    CONTACT_TO_EMAIL: "owner@test.example",
    TURNSTILE_SECRET_KEY: "secret",
    TURNSTILE_HOSTNAME: "studio.test",
    CONTACT_ALLOWED_ORIGIN: "https://studio.test",
  });
  let accept = true,
    challenge = true,
    email;
  global.fetch = async (url, options) => {
    if (String(url).includes("siteverify"))
      return Response.json({
        success: challenge,
        hostname: "studio.test",
        action: "inquiry",
      });
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
    assert.equal(email.html, undefined);
    assert.equal(email.reply_to, valid.email);
    assert.equal(
      Array.isArray(email.to) ? email.to[0] : email.to,
      "owner@test.example",
    );
    accept = false;
    const fail = await handler(req());
    assert.equal(fail.status, 502);
    assert.equal((await fail.json()).code, "error");
    challenge = false;
    assert.equal((await handler(req())).status, 400);
  } finally {
    global.fetch = nativeFetch;
    for (const key of Object.keys(process.env))
      if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});
