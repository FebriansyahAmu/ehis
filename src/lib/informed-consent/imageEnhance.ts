export interface EnhanceResult {
  enhanced: string;   // base64 PNG — black ink on transparent background
  autoThresh: number; // threshold value used (informational display)
}

export async function processSignaturePhoto(
  rawDataUrl: string,
  sensitivityPct = 50,
): Promise<EnhanceResult> {
  const res = await fetch("/api/enhance-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData: rawDataUrl, sensitivity: sensitivityPct }),
  });

  if (!res.ok) throw new Error("Gagal memproses gambar di server");

  return res.json() as Promise<EnhanceResult>;
}
