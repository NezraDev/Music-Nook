import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push({ url: page.url(), error: e.message }));
for (const route of [
  "/",
  "/about",
  "/about/",
  "/services",
  "/faq",
  "/faq/",
  "/student-gallery",
  "/contact?intent=lesson-inquiry&service=piano",
  "/contact/?intent=lesson-inquiry&service=piano",
]) {
  await page.goto("http://127.0.0.1:4173" + route);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  assert.equal(await page.locator("h1").count(), 1);
  if (route.includes("?")) {
    assert.equal(await page.locator("#type").inputValue(), "lesson-inquiry");
    assert.equal(await page.locator("#service").inputValue(), "piano");
  }
}
assert.deepEqual(errors, []);
console.log(
  "PASS: production HTML hydrates on all routes, query parameters prefill correctly, no browser runtime errors.",
);
await browser.close();
