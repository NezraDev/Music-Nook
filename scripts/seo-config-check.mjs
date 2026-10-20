import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
const run = (env) => {
  const r = spawnSync(process.execPath, ["scripts/prerender.mjs"], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error(r.stderr);
};
try {
  run({
    SITE_URL: "https://music-nook.test",
    SITE_READY: "true",
    CONTEXT: "deploy-preview",
    NETLIFY: "true",
  });
  let html = await fs.readFile("dist/contact/index.html", "utf8");
  assert.ok(
    html.includes('rel="canonical" href="https://music-nook.test/contact"'),
  );
  assert.ok(
    !html.includes('rel="canonical" href="https://music-nook.test/contact?'),
  );
  const faqHtml = await fs.readFile("dist/faq/index.html", "utf8");
  assert.ok(
    faqHtml.includes('rel="canonical" href="https://music-nook.test/faq"'),
  );
  assert.ok(faqHtml.includes("Frequently asked questions"));
  assert.ok(html.includes('name="robots" content="noindex,nofollow"'));
  assert.ok(
    (await fs.readFile("dist/_headers", "utf8")).includes(
      "X-Robots-Tag: noindex",
    ),
  );
  assert.ok(!(await fs.readFile("dist/sitemap.xml", "utf8")).includes("<url>"));
  run({
    SITE_URL: "https://music-nook.test",
    SITE_READY: "true",
    CONTEXT: "production",
    NETLIFY: "true",
  });
  html = await fs.readFile("dist/about/index.html", "utf8");
  assert.ok(
    html.includes('name="robots" content="noindex,nofollow"'),
    "visible placeholders stay noindex even in production",
  );
  assert.ok(!(await fs.readFile("dist/sitemap.xml", "utf8")).includes("<url>"));
  console.log(
    "PASS: configured absolute canonicals, query-free contact canonical, preview response noindex, sitemap excludes drafts, production placeholders fail closed.",
  );
} finally {
  run({ SITE_URL: "", SITE_READY: "false", CONTEXT: "", NETLIFY: "" });
  await fs.rm("dist/sitemap.xml", { force: true });
}
