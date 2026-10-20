import { chromium } from "playwright";
import assert from "node:assert/strict";
const baseURL = process.env.APP_BASE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1000, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/src/data.js*", async (route) => {
  const res = await route.fetch();
  let source = await res.text();
  source += `\nsiteData.gallery=[{id:'fixture-1',clientId:'fixture-student',src:'/images/music-nook-logo.png',thumbnail:'/images/music-nook-logo.png',width:500,height:500,alt:'Logo used as a test image',caption:'Test image one',category:'lessons',publicationPermission:true},{id:'fixture-2',clientId:'fixture-student',src:'/images/music-nook-logo.png',width:500,height:500,alt:'Second test image',caption:'Test image two',category:'lesson-moments',publicationPermission:true}];siteData.map.center=[0,0];siteData.map.marker=[0,0];`;
  await route.fulfill({ response: res, body: source });
});
await page.goto(baseURL + "/student-gallery");
await page.getByRole("button", { name: /Test image one/ }).click();
const dialog = page.getByRole("dialog");
await dialog.waitFor();
assert.equal(
  await dialog.locator("figcaption").textContent(),
  "Test image one",
);
assert.equal(await dialog.locator(".slide-indicator").count(), 2);
assert.equal(
  await dialog.getByRole("button", { name: "Previous photo", exact: true }).count(),
  1,
);
assert.equal(
  await dialog.getByRole("button", { name: "Next photo", exact: true }).count(),
  1,
);
assert.equal(await dialog.getByRole("button", { name: /pause/i }).count(), 0);
await dialog.getByRole("button", { name: "Next photo", exact: true }).click();
assert.equal(await dialog.locator("figcaption").textContent(), "Test image two");
await dialog.getByRole("button", { name: "Previous photo", exact: true }).click();
assert.equal(await dialog.locator("figcaption").textContent(), "Test image one");
await page.keyboard.press("ArrowRight");
assert.equal(
  await dialog.locator("figcaption").textContent(),
  "Test image two",
);
await page.keyboard.press("Escape");
assert.equal(await dialog.isVisible(), false);
assert.equal(
  await page.locator(".gallery-image").evaluate((el) => el === document.activeElement),
  true,
);
await page.getByRole("button", { name: "Lesson moments", exact: true }).click();
assert.equal(await page.locator(".gallery-album").count(), 1);
assert.equal(await page.locator(".gallery-photo-count").textContent(), "2 photos");
await page.getByRole("button", { name: /Test image one/ }).click();
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
assert.equal(
  await dialog.evaluate((el) => el.contains(document.activeElement)),
  true,
);
await page.keyboard.press("Escape");
await page.goto(baseURL + "/faq");
assert.equal(await page.locator("h1").textContent(), "Frequently asked questions");
assert.equal(await page.locator(".faq-page-item").count(), 5);
assert.equal(
  await page.getByText("The learner or family provides the instrument, such as a piano or guitar.").count(),
  1,
);
assert.equal(
  await page.getByText("Provided by the learner or family", { exact: true }).count(),
  2,
);
await page.goto(baseURL + "/contact");
assert.equal(await page.locator(".location-map").count(), 0);
assert.equal(await page.getByText("[Add service area]", { exact: true }).count(), 2);
await page.unroute("**/src/data.js*");
await page.route("**/src/App.jsx*", async (route) => {
  const res = await route.fetch();
  const source = (await res.text()).replaceAll(
    "import.meta.env.VITE_TURNSTILE_SITE_KEY",
    JSON.stringify("fixture-site-key"),
  );
  await route.fulfill({ response: res, body: source });
});
await page.route("https://challenges.cloudflare.com/turnstile/**", (route) =>
  route.fulfill({
    contentType: "application/javascript",
    body: `window.turnstile={render:(el,options)=>{options.callback('fixture-token');return 'widget'},remove:()=>{}};`,
  }),
);
let calls = 0,
  success = false;
await page.route("**/.netlify/functions/inquiry", async (route) => {
  calls++;
  await new Promise((r) => setTimeout(r, 250));
  await route.fulfill({
    status: success ? 200 : 502,
    contentType: "application/json",
    body: JSON.stringify({ code: success ? "success" : "error" }),
  });
});
await page.goto(
  baseURL + "/contact?intent=lesson-inquiry&service=voice",
);
await page.locator("#name").fill("Adult learner");
await page.locator("#email").fill("test@example.com");
await page.locator("#message").fill("Test inquiry");
await page.getByRole("button", { name: "Send Inquiry" }).click();
await page
  .getByRole("status")
  .filter({ hasText: "could not be sent" })
  .waitFor();
assert.equal(await page.locator("#message").inputValue(), "Test inquiry");
success = true;
await page.getByRole("button", { name: "Send Inquiry" }).click();
await page.getByRole("status").filter({ hasText: "Thank you" }).waitFor();
assert.equal(await page.locator("#name").inputValue(), "");
assert.equal(calls, 2);
assert.deepEqual(errors, []);
console.log(
  "PASS: gallery filter, arrows, Escape, focus return/trap; FAQ home-lesson preparation details; service-area contact placeholder without a fixed-location map; mocked form provider failure/success and content preservation.",
);
await browser.close();
