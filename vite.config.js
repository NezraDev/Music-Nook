import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { siteData } from "./src/data.js";
import { readFile, copyFile, mkdir } from "node:fs/promises";
// Match Netlify's explicit prerender rewrites during local production preview.
const previewRouting = {
  name: "prerender-preview-routes",
  configurePreviewServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, "http://localhost");
      const route = siteData.navigation.find(
        (r) =>
          r.path === url.pathname.replace(/\/$/, "") ||
          (r.path === "/" && url.pathname === "/"),
      );
      if (route && route.path !== "/") {
        req.url = route.path + "/index.html" + url.search;
        return next();
      }
      if (url.pathname.startsWith("/.netlify/functions/")) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ code: "unavailable" }));
      }
      if (
        route ||
        url.pathname === "/index.html" ||
        url.pathname.startsWith("/assets/") ||
        url.pathname.startsWith("/images/") ||
        ["/robots.txt", "/sitemap.xml"].includes(url.pathname)
      )
        return next();
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html");
      try {
        res.end(await readFile("dist/404.html", "utf8"));
      } catch {
        next();
      }
    });
  },
};
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    previewRouting,
    {
      name: "save-prerender-template",
      apply: "build",
      async closeBundle() {
        await mkdir(".cache", { recursive: true });
        await copyFile("dist/index.html", ".cache/prerender-template.html");
      },
    },
  ],
});
