/**
 * Generate Gwinya app icons (mobile + web) from a single master PNG.
 *
 * Master: apps/mobile/assets/gwinya-icon-source.png (the larynx mark, any
 * background — transparent or white both work). We recolour the mark to ink
 * and composite it onto linen tiles / transparent canvases at the sizes Expo
 * and the Next.js App Router expect.
 *
 * Run from the repo root (sharp is a web devDependency):
 *   node scripts/generate-icons.mjs
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(REPO, "apps/mobile/assets/gwinya-icon-source.png");
const INK = { r: 0x1f, g: 0x18, b: 0x12 }; // #1f1812
const LINEN = "#f5ede0";

// Convert the master to a transparent, ink-coloured mark. Opaque only where the
// source is opaque AND not white, so it works for transparent- or white-bg art.
async function transparentMark() {
  const trimmed = await sharp(SRC).trim({ threshold: 10 }).ensureAlpha().toBuffer();
  const { data, info } = await sharp(trimmed).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const a = data[i * channels + 3];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    out[i * 4] = INK.r;
    out[i * 4 + 1] = INK.g;
    out[i * 4 + 2] = INK.b;
    out[i * 4 + 3] = Math.round((a / 255) * (255 - lum));
  }
  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function compose(markPng, { size, scale, bg, out, flatten }) {
  const mark = await sharp(markPng).resize({ height: Math.round(size * scale) }).toBuffer();
  let img = sharp({
    create: { width: size, height: size, channels: 4, background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: mark, gravity: "center" }]);
  if (flatten) img = img.flatten({ background: bg });
  await img.png().toFile(out);
  console.log("wrote", path.relative(REPO, out));
}

const mark = await transparentMark();
const A = path.join(REPO, "apps/mobile/assets/images");

// Mobile
await compose(mark, { size: 1024, scale: 0.62, bg: LINEN, flatten: true, out: path.join(A, "icon.png") });
await compose(mark, { size: 1024, scale: 0.55, bg: null, out: path.join(A, "android-icon-foreground.png") });
await compose(mark, { size: 1024, scale: 0.7, bg: null, out: path.join(A, "splash-icon.png") });
await compose(mark, { size: 196, scale: 0.72, bg: LINEN, flatten: true, out: path.join(A, "favicon.png") });

// Web (Next.js App Router file conventions)
await compose(mark, { size: 512, scale: 0.64, bg: LINEN, flatten: true, out: path.join(REPO, "app/icon.png") });
await compose(mark, { size: 180, scale: 0.64, bg: LINEN, flatten: true, out: path.join(REPO, "app/apple-icon.png") });

console.log("done");
