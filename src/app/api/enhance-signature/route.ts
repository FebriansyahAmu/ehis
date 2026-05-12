import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

/**
 * Sauvola local adaptive thresholding (O(n) via integral images).
 *
 * Unlike a global threshold, Sauvola computes a per-pixel threshold based on
 * the LOCAL mean and standard deviation in a surrounding window. This means
 * a shadowed region of the paper gets its OWN lower threshold, so only pixels
 * darker than their LOCAL neighbourhood are classified as ink — shadows on
 * the paper no longer trigger false positives.
 *
 * Formula: T(x,y) = mean(x,y) * (1 − k * (1 − std(x,y) / R))
 *   k  — sensitivity: higher = more ink captured
 *   R  — normalisation constant (128 = mid-range of 0–255)
 */
function buildSauvolaMask(
  pixels: Uint8Array,
  width: number,
  height: number,
  winSize: number,  // window side length (odd), e.g. 31
  k: number,        // 0.10 (subtle) … 0.40 (aggressive)
): Uint8Array {
  const isInk = new Uint8Array(width * height);
  const half  = Math.floor(winSize / 2);
  const R     = 128;
  const W1    = width + 1;
  const H1    = height + 1;

  // Integral images for O(1) window sum / sum-of-squares
  const intS  = new Float64Array(W1 * H1);
  const intSq = new Float64Array(W1 * H1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v  = pixels[y * width + x];
      const i  = (y + 1) * W1 + (x + 1);
      intS[i]  = v     + intS[y * W1 + (x + 1)] + intS[(y + 1) * W1 + x] - intS[y * W1 + x];
      intSq[i] = v * v + intSq[y * W1 + (x + 1)] + intSq[(y + 1) * W1 + x] - intSq[y * W1 + x];
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(x - half, 0);
      const y1 = Math.max(y - half, 0);
      const x2 = Math.min(x + half, width  - 1);
      const y2 = Math.min(y + half, height - 1);
      const n  = (x2 - x1 + 1) * (y2 - y1 + 1);

      const s  = intS [(y2+1)*W1+(x2+1)] - intS [y1*W1+(x2+1)] - intS [(y2+1)*W1+x1] + intS [y1*W1+x1];
      const sq = intSq[(y2+1)*W1+(x2+1)] - intSq[y1*W1+(x2+1)] - intSq[(y2+1)*W1+x1] + intSq[y1*W1+x1];

      const mean = s / n;
      const std  = Math.sqrt(Math.max(0, sq / n - mean * mean));
      const thr  = mean * (1 - k * (1 - std / R));

      isInk[y * width + x] = pixels[y * width + x] <= thr ? 1 : 0;
    }
  }
  return isInk;
}

export async function POST(req: NextRequest) {
  try {
    const { imageData, sensitivity = 50 } = await req.json() as {
      imageData: string;
      sensitivity?: number;
    };

    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const inputBuffer = Buffer.from(base64, "base64");

    const { width: W, height: H } = await sharp(inputBuffer).metadata();
    const blurSigma = Math.max(15, Math.round(Math.min(W!, H!) / 10));

    // ── Stage 1: Paper region mask ────────────────────────────────────
    // Large blur erases all ink strokes → only the broad bright paper blob
    // survives. Threshold identifies WHERE the paper is so we can exclude
    // the dark table/background outside it.
    const { data: paperData } = await sharp(inputBuffer)
      .greyscale()
      .blur(blurSigma)
      .normalise()
      .threshold(100)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // ── Stage 2: Raw grayscale pixels (no global stretch) ─────────────
    // We intentionally skip normalise here so the Sauvola window statistics
    // reflect the actual local contrast rather than a globally stretched range.
    const { data: grayData, info } = await sharp(inputBuffer)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // ── Stage 3: Sauvola adaptive threshold ───────────────────────────
    // sensitivity 10 → k=0.10 (subtle — only very dark ink)
    // sensitivity 90 → k=0.40 (aggressive — captures lighter strokes too)
    const k = 0.10 + (sensitivity / 100) * 0.30;
    const inkMask = buildSauvolaMask(
      grayData as unknown as Uint8Array,
      info.width, info.height,
      31, k,
    );

    // ── Stage 4: Compose RGBA ─────────────────────────────────────────
    // Ink pixel AND on-paper pixel → pure black opaque; everything else → transparent
    const numPixels = info.width * info.height;
    const rgba = Buffer.alloc(numPixels * 4, 0);

    for (let i = 0; i < numPixels; i++) {
      if (inkMask[i] && paperData[i] > 0) {
        rgba[i * 4 + 3] = 255;
      }
    }

    const resultBuffer = await sharp(rgba, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();

    return NextResponse.json({
      enhanced: `data:image/png;base64,${resultBuffer.toString("base64")}`,
      autoThresh: Math.round(k * 100),  // display: k as integer 10–40
    });

  } catch (err) {
    console.error("[enhance-signature]", err);
    return NextResponse.json({ error: "Gagal memproses gambar" }, { status: 500 });
  }
}
