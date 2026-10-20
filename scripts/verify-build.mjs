import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { siteData as d } from "../src/data.js";
const redirects = await fs.readFile("dist/_redirects", "utf8");
const titles = [];
for (const r of [...d.navigation, { id: "notFound", path: "/404" }]) {
  const filename =
    r.id === "home"
      ? "dist/index.html"
      : r.id === "notFound"
        ? "dist/404.html"
        : `dist${r.path}/index.html`;
  const html = await fs.readFile(filename, "utf8");
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, r.path);
  assert.ok(
    html.includes(d.seo.pages[r.id].title.replaceAll("&", "&amp;")),
    r.path + " title",
  );
  assert.ok(html.includes('name="description"'));
  assert.ok(html.includes('name="robots" content="noindex,nofollow"'));
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(!titles.includes(title));
  titles.push(title);
  const ld = JSON.parse(
    html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
  );
  assert.equal(ld.name, d.brand.name);
  assert.equal(ld.aggregateRating, undefined);
  assert.ok(!html.includes("example.com"));
  assert.ok(!html.includes('rel="canonical"'));
  for (const m of html.matchAll(/href="(\/[^"?#]*)/g)) {
    if (m[1].startsWith("/assets/") || m[1].startsWith("/images/")) {
      await fs.access("dist" + m[1]);
      continue;
    }
    assert.ok(
      d.navigation.some((n) => n.path === m[1]) || m[1] === "/404",
      `Internal link ${m[1]}`,
    );
  }
}
assert.ok(redirects.includes("/* /404.html 404"));
assert.ok(!redirects.includes("/* /index.html 200"));
for (const route of d.navigation.filter((r) => r.path !== "/"))
  assert.ok(redirects.includes(`${route.path} ${route.path}/index.html 200`));
assert.ok(
  (await fs.readFile("dist/robots.txt", "utf8")).includes("Disallow: /"),
);
assert.ok(
  (await fs.readFile("dist/_headers", "utf8")).includes(
    "X-Robots-Tag: noindex",
  ),
);
const images = await fs.readdir("dist/images");
assert.ok(images.every((f) => f.endsWith(".png")));
assert.ok(!images.some((f) => f.startsWith("student-")));
console.log(
  "PASS: six public prerendered routes plus 404, one h1 each, unique titles, descriptions, safe JSON-LD, valid internal links/assets, no placeholder canonical/domain, noindex, explicit route rewrites and 404, approved PNG deployment assets only.",
);
