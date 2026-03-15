"use node";

import { uploadToUploadThing } from "./suno";

const FAL_COMPOSE_URL = "https://fal.run/fal-ai/ffmpeg-api/compose";

function getFalKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY not set");
  return key;
}

export async function falComposeAndUpload(
  instrumentalUrl: string,
  vocalsUrl: string
): Promise<string> {
  console.log("[fal] Composing instrumental + vocals", { instrumentalUrl, vocalsUrl });

  const res = await fetch(FAL_COMPOSE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${getFalKey()}`,
    },
    body: JSON.stringify({
      tracks: [
        {
          id: "instrumental",
          type: "audio",
          keyframes: [{ url: instrumentalUrl, timestamp: 0, duration: 30000 }],
        },
        {
          id: "vocals",
          type: "audio",
          keyframes: [{ url: vocalsUrl, timestamp: 0, duration: 30000 }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`fal.ai compose error (${res.status}): ${errText}`);
  }

  const json = (await res.json()) as { video_url?: string };
  const composedUrl = json.video_url;
  if (!composedUrl) throw new Error("No video_url in fal.ai compose response");

  console.log("[fal] Compose done, downloading result");
  const audioRes = await fetch(composedUrl);
  if (!audioRes.ok) throw new Error("Failed to download composed audio from fal.ai");
  const buf = Buffer.from(await audioRes.arrayBuffer());

  const uploadedUrl = await uploadToUploadThing(buf, `combined-mix-${Date.now()}.mp4`);
  console.log("[fal] Uploaded combined mix", { uploadedUrl });
  return uploadedUrl;
}
