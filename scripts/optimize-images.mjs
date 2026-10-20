import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { siteData as d } from "../src/data.js";

// Preserve PNG originals and publish compressed variants of approved photos only.
const images = new Set([
  d.pages.home.heroImage.src,
  ...d.gallery.filter((photo) => photo.publicationPermission === true)
    .flatMap((photo) => [photo.src, photo.thumbnail]).filter(Boolean),
]);
let data = await fs.readFile("src/data.js", "utf8");
let before = 0, after = 0;
for (const src of images) {
  const original = src.replace(/\.webp$/i, ".png");
  const input = path.join("public", original);
  const webp = original.replace(/\.png$/i, ".webp");
  if (webp === original) continue;
  const output = path.join("public", webp);
  before += (await fs.stat(input)).size;
  await sharp(input).webp({ quality: src.includes("thumb") ? 76 : 82, effort: 5 }).toFile(output);
  after += (await fs.stat(output)).size;
  data = data.replaceAll(JSON.stringify(src), JSON.stringify(webp));
}
await fs.writeFile("src/data.js", data);
console.log(JSON.stringify({ images: images.size, originalBytes: before, compressedBytes: after,
  reduction: `${((1 - after / before) * 100).toFixed(1)}%` }));
