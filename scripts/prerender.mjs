import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { PassThrough } from "node:stream";
import { createServer } from "vite";
import { siteData as d } from "../src/data.js";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const { default: App } = await server.ssrLoadModule("/src/App.jsx");
const template = await fs.readFile(".cache/prerender-template.html", "utf8");
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let origin = "";
try {
  const u = new URL(process.env.SITE_URL || d.seo.siteUrl);
  if (
    u.protocol === "https:" &&
    !/localhost|example\.|placeholder/i.test(u.hostname)
  )
    origin = u.origin;
} catch {}
const ready =
  (process.env.SITE_READY === "true" || d.seo.ready === true) &&
  !!origin &&
  (process.env.CONTEXT === "production" || !process.env.NETLIFY);
const render = (url) =>
  new Promise((resolve, reject) => {
    let markup = "";
    const stream = new PassThrough();
    stream.on("data", (c) => (markup += c));
    stream.on("end", () => resolve(markup));
    stream.on("error", reject);
    const s = renderToPipeableStream(
      React.createElement(
        StaticRouter,
        { location: url },
        React.createElement(App),
      ),
      {
        onAllReady() {
          s.pipe(stream);
        },
        onError: reject,
      },
    );
  });
const entries = [...d.navigation, { id: "notFound", path: "/404" }];
const redirects = [];
const indexed = [];
for (const route of entries) {
  const seo = d.seo.pages[route.id];
  let index = ready && seo.indexable === true && route.id !== "notFound";
  const canonical =
    origin && route.id !== "notFound"
      ? origin + (route.path === "/" ? "/" : route.path)
      : "";
  const share = d.seo.shareImage;
  const ld = {
    "@context": "https://schema.org",
    "@type": d.seo.organization.type,
    name: d.brand.name,
    description: d.seo.organization.description,
    sameAs: d.socialLinks.map((s) => s.url),
  };
  if (origin) ld.url = origin;
  if (d.contact.phone) ld.telephone = d.contact.phone;
  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}">`,
    `<meta name="robots" content="${index ? "index,follow" : "noindex,nofollow"}">`,
    `<meta property="og:title" content="${esc(seo.title)}">`,
    `<meta property="og:description" content="${esc(seo.description)}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${esc(d.brand.name)}">`,
  ];
  if (canonical)
    tags.push(
      `<link rel="canonical" href="${esc(canonical)}">`,
      `<meta property="og:url" content="${esc(canonical)}">`,
    );
  if (origin && share.approved) {
    tags.push(
      `<meta property="og:image" content="${esc(origin + share.src)}">`,
      `<meta property="og:image:alt" content="${esc(share.alt)}">`,
      `<meta property="og:image:width" content="${share.width}">`,
      `<meta property="og:image:height" content="${share.height}">`,
      '<meta name="twitter:card" content="summary_large_image">',
    );
  }
  const verification =
    process.env.SEARCH_CONSOLE_VERIFICATION || d.seo.searchConsoleVerification;
  if (verification)
    tags.push(
      `<meta name="google-site-verification" content="${esc(verification)}">`,
    );
  tags.push(
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
  );
  const body = await render(route.path);
  if (/\[(?:Add|Instructor)/.test(body)) {
    index = false;
    tags[2] = '<meta name="robots" content="noindex,nofollow">';
    console.log(`Draft placeholders: ${route.path} (noindex)`);
  }
  const html = template.replace('href="/images/favicon.png"', `href="${esc(d.brand.favicon.src)}"`)
    .replace(/<title>.*?<\/title>/, "")
    .replace("</head>", tags.join("") + "</head>")
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  const dest =
    route.id === "home"
      ? "dist/index.html"
      : route.id === "notFound"
        ? "dist/404.html"
        : `dist${route.path}/index.html`;
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, html);
  if (route.id !== "notFound" && route.id !== "home")
    redirects.push(
      `${route.path} ${route.path}/index.html 200`,
      `${route.path}/ ${route.path}/index.html 200`,
    );
  if (index) indexed.push(canonical);
}
redirects.push("/* /404.html 404");
await fs.writeFile("dist/_redirects", redirects.join("\n") + "\n");
await fs.writeFile(
  "dist/_headers",
  ready ? "" : "/*\n  X-Robots-Tag: noindex, nofollow\n",
);
await fs.writeFile(
  "dist/robots.txt",
  `User-agent: *\n${ready ? "Allow: /" : "Disallow: /"}\n${origin && indexed.length ? `Sitemap: ${origin}/sitemap.xml\n` : ""}`,
);
if (origin)
  await fs.writeFile(
    "dist/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexed.map((u) => `<url><loc>${esc(u)}</loc></url>`).join("")}</urlset>`,
  );
if (!origin) await fs.rm("dist/sitemap.xml", { force: true });
// Unapproved student originals and derived assets must not enter deployment output.
const allowed = new Set([
  d.brand.logo.src,
  d.seo.shareImage.src,
  d.brand.favicon.src,
  ...d.gallery
    .filter((i) => i.publicationPermission === true)
    .flatMap((i) => [i.src, i.thumbnail]),
  ...d.instructors.flatMap((i) => (i.portrait?.src ? [i.portrait.src] : [])),
  ...d.clientLogos
    .filter((i) => i.publicationPermission === true)
    .map((i) => i.src),
]);
for (const file of await fs.readdir("dist/images"))
  if (!allowed.has("/images/" + file)) await fs.rm("dist/images/" + file);
await server.close();
console.log(
  `Prerendered ${entries.length} routes. Indexing ${ready ? "enabled for ready routes" : "disabled (draft or preview)"}.`,
);
