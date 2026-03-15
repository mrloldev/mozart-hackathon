"use node";

import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { uploadToUploadThing } from "./suno";

function mixAudioWithFFmpeg(
  instrumentalUrl: string,
  vocalsUrl: string
): Promise<Buffer> {
  const ffmpeg = ffmpegPath;
  if (!ffmpeg || typeof ffmpeg !== "string")
    throw new Error("ffmpeg-static not available");

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const proc = spawn(
      ffmpeg,
      [
        "-i", instrumentalUrl,
        "-i", vocalsUrl,
        "-filter_complex",
        "[0:a]volume=0.85[inst];[1:a]volume=0.65[voc];[inst][voc]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[out]",
        "-map", "[out]",
        "-ac", "2",
        "-f", "mp3",
        "pipe:1",
      ],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    proc.stdout?.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stderr?.on("data", () => {});
    proc.on("close", (code) => {
      if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`FFmpeg mix exited with code ${code}`));
    });
    proc.on("error", (err) => reject(err));
    proc.stdin?.end();
  });
}

export async function falComposeAndUpload(
  instrumentalUrl: string,
  vocalsUrl: string
): Promise<string> {
  console.log("[mix] Composing instrumental + vocals with FFmpeg", {
    instrumentalUrl,
    vocalsUrl,
  });

  const buf = await mixAudioWithFFmpeg(instrumentalUrl, vocalsUrl);
  console.log("[mix] FFmpeg compose done, uploading", {
    bytes: buf.length,
  });

  const uploadedUrl = await uploadToUploadThing(
    buf,
    `combined-mix-${Date.now()}.mp3`
  );
  console.log("[mix] Uploaded combined mix", { uploadedUrl });
  return uploadedUrl;
}
