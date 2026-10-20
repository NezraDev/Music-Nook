import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const root = "images",
  out = "public/images";
await fs.mkdir(out, { recursive: true });
await sharp(path.join(root, "Logo", "No background.png"))
  .png({ compressionLevel: 9 })
  .toFile(path.join(out, "music-nook-logo.png"));
await sharp(path.join(root, "Logo", "No background.png"))
  .resize(64, 64)
  .png()
  .toFile(path.join(out, "favicon.png"));
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: "#0D1929" },
})
  .composite([
    {
      input: await sharp(path.join(root, "Logo", "No background.png"))
        .resize(560, 560)
        .toBuffer(),
      gravity: "centre",
    },
  ])
  .png()
  .toFile(path.join(out, "music-nook-share.png"));
// HEIC/JPEG/PNG photo conversion is isolated in the project Python environment.
import { spawnSync } from "node:child_process";
const python =
  process.platform === "win32"
    ? ".venv/Scripts/python.exe"
    : ".venv/bin/python";
const result = spawnSync(python, ["scripts/prepare-photos.py"], {
  stdio: "inherit",
});
if (result.status !== 0)
  throw new Error(
    "Create .venv and install requirements-images.txt before preparing photos.",
  );
