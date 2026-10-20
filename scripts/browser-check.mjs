import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const baseURL = process.env.APP_BASE_URL ?? "http://127.0.0.1:5173";
await fs.mkdir(".impeccable/review", { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const loadGalleryImages = async () => {
  await page.locator(".gallery-grid img").evaluateAll((images) => {
    images.forEach((image) => {
      image.loading = "eager";
    });
  });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".gallery-grid img")].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    null,
    { timeout: 10000 },
  );
};
page.on("pageerror", (e) => errors.push(e.message));
const report = [];
for (const route of [
  "/",
  "/about",
  "/services",
  "/faq",
  "/student-gallery",
  "/contact",
]) {
  await page.goto(baseURL + route);
  await page.locator("h1").waitFor();
  assert.equal(await page.locator("h1").count(), 1);
  await page.waitForTimeout(300);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  report.push({
    route,
    violations: axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
}
await page.goto(baseURL + "/");
await page.locator(".gallery-grid").waitFor();
await page.screenshot({
  path: ".impeccable/review/desktop.png",
  fullPage: true,
});
await page.goto(baseURL + "/faq");
assert.equal(await page.locator(".faq-page-item").count(), 5);
assert.equal(
  await page.getByText("Lessons are taught at the learner’s home.", { exact: true }).count(),
  1,
);
assert.equal(await page.getByRole("link", { name: "FAQ", exact: true }).count(), 2);
await page.screenshot({
  path: ".impeccable/review/faq-desktop.png",
  fullPage: true,
});
await page.goto(baseURL + "/services");
assert.equal(await page.locator(".services-faq-item").count(), 3);
assert.equal(
  await page.locator(".services-faq-item").nth(1).locator("summary").textContent(),
  "Who provides the instrument?",
);
await page.getByRole("link", { name: "Read the FAQs" }).click();
await page.waitForURL("**/faq");
await page.goto(baseURL + "/services");
await page.getByRole("link", { name: "Ask About Lessons" }).first().click();
await page.waitForURL("**/contact?intent=lesson-inquiry&service=piano");
assert.equal(await page.locator("#type").inputValue(), "lesson-inquiry");
assert.equal(await page.locator("#service").inputValue(), "piano");
await page.getByRole("button", { name: "Send Inquiry" }).click();
assert.equal(await page.locator("#name").getAttribute("aria-invalid"), "true");
assert.equal(
  await page.locator("#name").evaluate((el) => el === document.activeElement),
  true,
);
await page.locator("#name").fill("Test Adult");
await page.locator("#email").fill("test@example.com");
await page.locator("#message").fill("Question about piano lessons");
await page.getByRole("button", { name: "Send Inquiry" }).click();
await page.getByRole("status").filter({ hasText: "not configured" }).waitFor();
assert.equal(await page.locator("#name").inputValue(), "Test Adult");
await page.goto(
  baseURL + "/contact?intent=malicious&service=unknown",
);
assert.equal(await page.locator("#type").inputValue(), "general");
assert.equal(await page.locator("#service").inputValue(), "");
assert.equal(await page.locator(".map-canvas").count(), 0);
assert.equal(await page.locator(".location-map").count(), 0);
assert.equal(await page.getByText("[Add service area]", { exact: true }).count(), 2);
await page.goto(baseURL + "/student-gallery");
const albumCards = page.locator(".gallery-album");
await albumCards.first().waitFor();
await loadGalleryImages();
assert.equal(await albumCards.count(), 9);
assert.equal(
  await page.locator(".gallery-image").evaluateAll((buttons) =>
    buttons.every((button) => {
      const rect = button.getBoundingClientRect();
      return Math.abs(rect.width / rect.height - 0.75) < 0.01;
    }),
  ),
  true,
);
assert.equal(
  await page.locator(".gallery-grid img").evaluateAll((images) =>
    images.every((image) => image.currentSrc.includes("-thumb.png")),
  ),
  true,
);
const photoCounts = await page.locator(".gallery-photo-count").allTextContents();
assert.equal(photoCounts.length, 9);
assert.equal(
  photoCounts.reduce((total, count) => total + Number.parseInt(count, 10), 0),
  25,
);
assert.equal(photoCounts.every((count) => Number.parseInt(count, 10) > 1), true);
const opener = page.locator(".gallery-image").first();
await opener.click();
const dialog = page.getByRole("dialog", { name: "Photos of Alma and Maria" });
await dialog.waitFor();
await page.screenshot({
  path: ".impeccable/review/gallery-album-desktop.png",
  fullPage: true,
});
assert.equal(await dialog.locator(".slide-indicator").count(), 3);
await dialog.locator(".lightbox-image").waitFor();
await dialog.locator(".slide-indicator-fill.is-current.is-running").waitFor();
const initialSlide = await dialog.locator(".lightbox-image").getAttribute("src");
assert.equal(
  await dialog.locator(".lightbox-image").evaluate((image) => {
    const figure = image.closest("figure").getBoundingClientRect();
    const frame = image.closest(".lightbox-image-frame").getBoundingClientRect();
    const photo = image.getBoundingClientRect();
    const modal = image.closest(".lightbox").getBoundingClientRect();
    return (
      image.complete &&
      image.naturalWidth > 0 &&
      getComputedStyle(image).objectPosition === "50% 50%" &&
      getComputedStyle(image).objectFit === "contain" &&
      Math.abs(frame.x + frame.width / 2 - (photo.x + photo.width / 2)) < 1 &&
      Math.abs(frame.y + frame.height / 2 - (photo.y + photo.height / 2)) < 1 &&
      Math.abs(figure.x + figure.width / 2 - (frame.x + frame.width / 2)) < 1 &&
      Math.abs(modal.x + modal.width / 2 - innerWidth / 2) < 1 &&
      Math.abs(modal.y + modal.height / 2 - innerHeight / 2) < 1
    );
  }),
  true,
);
await page.waitForFunction(
  (previous) =>
    document.querySelector(".lightbox-image")?.getAttribute("src") !== previous,
  initialSlide,
  { timeout: 8500 },
);
const keyboardSlide = await dialog.locator(".lightbox-image").getAttribute("src");
await page.keyboard.press("ArrowRight");
assert.notEqual(
  await dialog.locator(".lightbox-image").getAttribute("src"),
  keyboardSlide,
);
assert.equal(
  await dialog.getByRole("button", { name: "Next photo", exact: true }).count(),
  1,
);
assert.equal(
  await dialog.getByRole("button", { name: "Previous photo", exact: true }).count(),
  1,
);
assert.equal(
  await dialog.getByRole("button", { name: /pause/i }).count(),
  0,
);
assert.equal(await albumCards.count(), 9);
await page.keyboard.press("Escape");
assert.equal(await dialog.isVisible(), false);
assert.equal(
  await opener.evaluate((el) => el === document.activeElement),
  true,
);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(baseURL + "/student-gallery");
await page.locator(".gallery-image").first().click();
const reducedDialog = page.getByRole("dialog", { name: "Photos of Alma and Maria" });
await reducedDialog.locator(".slide-indicator-fill.is-current.is-still").waitFor();
const reducedMotionSlide = await reducedDialog.locator(".lightbox-image").getAttribute("src");
await page.waitForTimeout(250);
assert.equal(
  await reducedDialog.locator(".lightbox-image").getAttribute("src"),
  reducedMotionSlide,
);
await page.keyboard.press("Escape");
await page.emulateMedia({ reducedMotion: "no-preference" });
await page.goto(baseURL + "/services");
assert.equal(await page.locator(".lesson").count(), 3);
await page.locator(".lesson-guitar .button").click();
await page.waitForURL("**/contact?intent=lesson-inquiry&service=guitar");
await page.waitForFunction(
  () => document.querySelector("#service")?.value === "guitar",
);
assert.equal(await page.locator("#type").inputValue(), "lesson-inquiry");
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseURL + "/");
await page.locator(".gallery-grid").waitFor();
await loadGalleryImages();
await page.screenshot({
  path: ".impeccable/review/mobile.png",
  fullPage: true,
});
await page.goto(baseURL + "/faq");
await page.screenshot({
  path: ".impeccable/review/faq-mobile.png",
  fullPage: true,
});
await page.goto(baseURL + "/student-gallery");
await loadGalleryImages();
await page.locator(".gallery-image").first().click();
const mobileDialog = page.getByRole("dialog", { name: "Photos of Alma and Maria" });
await mobileDialog.locator(".lightbox-image").waitFor();
assert.equal(await mobileDialog.locator(".slide-indicator").count(), 3);
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
assert.equal(
  await mobileDialog.locator(".lightbox-image").evaluate((image) => {
    const frame = image.closest(".lightbox-image-frame").getBoundingClientRect();
    const photo = image.getBoundingClientRect();
    const modal = image.closest(".lightbox").getBoundingClientRect();
    const previous = image
      .closest(".lightbox-carousel")
      .querySelector(".lightbox-prev")
      .getBoundingClientRect();
    const next = image
      .closest(".lightbox-carousel")
      .querySelector(".lightbox-next")
      .getBoundingClientRect();
    return (
      getComputedStyle(image).objectFit === "contain" &&
      Math.abs(frame.x + frame.width / 2 - (photo.x + photo.width / 2)) < 1 &&
      Math.abs(frame.y + frame.height / 2 - (photo.y + photo.height / 2)) < 1 &&
      Math.abs(frame.x + frame.width / 2 - innerWidth / 2) < 1 &&
      previous.right <= frame.left &&
      next.left >= frame.right &&
      Math.abs(modal.x + modal.width / 2 - innerWidth / 2) < 1
    );
  }),
  true,
);
await page.screenshot({
  path: ".impeccable/review/gallery-album-mobile.png",
  fullPage: true,
});
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "Menu", exact: true }).click();
assert.equal(await page.locator("#main-nav").isVisible(), true);
await page.keyboard.press("Escape");
assert.equal(await page.locator("#main-nav").isVisible(), false);
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page
  .locator("#main-nav")
  .getByRole("link", { name: "Inquire Now" })
  .click();
await page.waitForURL("**/contact?intent=lesson-inquiry");
await page.waitForFunction(() => document.querySelector("#type")?.value === "lesson-inquiry");
assert.equal(await page.locator("#type").inputValue(), "lesson-inquiry");
for (const width of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of [
    "/",
    "/about",
    "/services",
    "/faq",
    "/student-gallery",
    "/contact",
  ]) {
    await page.goto(baseURL + route);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${width} ${route} overflow`,
    );
  }
}
await fs.writeFile(
  ".impeccable/review/browser-report.json",
  JSON.stringify({ report, errors }, null, 2),
);
console.log(JSON.stringify({ report, errors }, null, 2));
await browser.close();
