import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import fs from "node:fs/promises";
await fs.mkdir(".cache",{recursive:true});
const profile=await fs.mkdtemp(".cache/lighthouse-");
const chrome = await chromeLauncher.launch({
  chromePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  chromeFlags: ["--headless", "--no-first-run", "--disable-extensions"],
  userDataDir: profile,
});
try {
  const result = await lighthouse("http://127.0.0.1:4173/", {
    port: chrome.port,
    output: "json",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    logLevel: "error",
  });
  const summary = {
    scores: Object.fromEntries(
      Object.entries(result.lhr.categories).map(([k, v]) => [
        k,
        Math.round(v.score * 100),
      ]),
    ),
    metrics: Object.fromEntries(
      [
        "first-contentful-paint",
        "largest-contentful-paint",
        "total-blocking-time",
        "cumulative-layout-shift",
      ].map((k) => [k, result.lhr.audits[k].displayValue]),
    ),
    findings: Object.values(result.lhr.audits)
      .filter((a) => a.score !== null && a.score < 1)
      .map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        displayValue: a.displayValue,
      })),
  };
  await fs.writeFile(".impeccable/review/lighthouse.json", result.report);
  await fs.writeFile(
    ".impeccable/review/performance-summary.json",
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await chrome.kill();
}
