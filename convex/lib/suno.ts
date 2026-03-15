"use node";

/**
 * Centralized Suno API + UploadThing integration.
 *
 * For Suno upload-cover, the uploadUrl must be a publicly accessible URL of
 * the source audio. We get this from UploadThing after storing files:
 * uploadToUploadThing() returns the ufsUrl — pass that as uploadUrl to Suno.
 */
import { spawn } from "child_process";
import { UTApi } from "uploadthing/server";
import ffmpegPath from "ffmpeg-static";

const SUNO_BASE = "https://api.kie.ai/api/v1";
const MAX_OUTPUT_SEC = 30;

async function trimAudioToSeconds(buf: Buffer, maxSec: number): Promise<Buffer> {
  const ffmpeg = ffmpegPath;
  if (!ffmpeg || typeof ffmpeg !== "string") return buf;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const proc = spawn(ffmpeg, ["-i", "pipe:0", "-t", String(maxSec), "-acodec", "copy", "-f", "mp3", "pipe:1"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    proc.stdin?.write(buf, (err) => {
      if (err) reject(err);
      else proc.stdin?.end();
    });
    proc.stdout?.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stderr?.on("data", () => {});
    proc.on("close", (code) => {
      if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
      else resolve(buf);
    });
    proc.on("error", () => resolve(buf));
  });
}
const BEAT_STYLE = "Drums, punchy kick drum, snappy snare, driving rhythm, energetic battle beat";
const CALLBACK_URL = "https://example.com/callback";

function getUtapi(): UTApi {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) throw new Error("UPLOADTHING_TOKEN not set");
  return new UTApi({ token });
}

/**
 * Uploads audio buffer to UploadThing and returns the public URL (ufsUrl).
 * This URL is sent to Suno's upload-cover API as the `uploadUrl` param so Suno can fetch the source audio.
 */
export async function uploadToUploadThing(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const utapi = getUtapi();
  const file = new File([new Uint8Array(buffer)], filename, { type: "audio/mpeg" });
  const response = await utapi.uploadFiles(file);
  if (response.error) {
    throw new Error(`UploadThing upload failed: ${response.error.message}`);
  }
  return response.data.ufsUrl;
}

const MELODY_STYLE = "Instrumental melody, single instrument only, guitar or piano";
const MELODY_PROMPT = "Single instrument melody. Use only guitar or piano. No other instruments.";

const INSTRUMENTAL_STYLE =
  "Production instrumental. Frame-accurate to source. Punchy kick, snappy snare, guitar or piano melody. Temporal fidelity.";

const INSTRUMENTAL_PROMPT = `The source is a combined beat (drums) + rhythm/melody mix, at most 30 seconds long. Track it second by second. Output must match the reference temporally.

Critical: Your output must be EXACTLY the same length as the source. Do not extend beyond the source. Maximum 30 seconds. Match every second of your output to the same moment in the source. No stretching, compressing, reordering, or adding bars.

- Beat/rhythm: Align every kick, snare, hi-hat with source timing. Preserve groove and swing.
- Melody: Mirror note placement, phrasing, dynamics second by second.
- Structure: Same sections, transitions, build-ups as source. No added or removed bars.
- Production: Crisp drums (punchy kick, snappy snare), clear melodic instrument (guitar or piano). Instrumental only, no vocals.
- Goal: Professional studio version of this exact reference—temporal clone, first 30 seconds only.`;

const VOCALS_STYLE = "Clear lead vocals, professional production, polished vocal tone";
const VOCALS_PROMPT =
  "Transform the vocal recording into production-quality lead vocals. Preserve the melody, phrasing, and timing second by second. Polished voice, clear enunciation, professional mix. Keep the same structure and emotional delivery.";

type CoverRole = "beat" | "melody" | "instrumental" | "vocals";

function getCoverParams(role: CoverRole): {
  prompt: string;
  style: string;
  title: string;
  instrumental: boolean;
} {
  if (role === "beat") return { prompt: BEAT_STYLE, style: BEAT_STYLE, title: "Beat", instrumental: true };
  if (role === "instrumental")
    return { prompt: INSTRUMENTAL_PROMPT, style: INSTRUMENTAL_STYLE, title: "Instrumental", instrumental: true };
  if (role === "vocals") return { prompt: VOCALS_PROMPT, style: VOCALS_STYLE, title: "Vocals", instrumental: false };
  return { prompt: MELODY_PROMPT, style: MELODY_STYLE, title: "Melody", instrumental: true };
}

/**
 * Calls Suno upload-cover API. The `uploadUrl` must be a publicly accessible URL of the source audio.
 * Use the UploadThing ufsUrl from uploadToUploadThing or from stored recordings (e.g. beat's fileUrl).
 */
export async function sunoUploadAndCover(
  apiKey: string,
  uploadUrl: string,
  role: CoverRole = "melody"
): Promise<string> {
  const { prompt, style, title, instrumental } = getCoverParams(role);
  const res = await fetch(`${SUNO_BASE}/generate/upload-cover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      uploadUrl,
      prompt,
      style,
      title,
      customMode: true,
      instrumental,
      model: "V5",
      audioWeight: 1,
      callBackUrl: CALLBACK_URL,
    }),
  });

  if (!res.ok) throw new Error(`Suno ${role} error: ${await res.text()}`);
  const json = (await res.json()) as { code?: number; data?: { taskId?: string }; msg?: string };
  if (json.code !== 200) throw new Error(json.msg ?? `Suno ${role} failed`);
  const taskId = json.data?.taskId;
  if (!taskId) throw new Error(`No taskId from Suno ${role}`);
  return taskId;
}

export async function sunoPollAndUpload(
  apiKey: string,
  taskId: string,
  role: "beat" | "melody" | "instrumental" | "vocals" = "melody"
): Promise<string> {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(
      `${SUNO_BASE}/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) continue;
    const json = (await res.json()) as {
      code?: number;
      data?: {
        status?: string;
        response?: { sunoData?: { audioUrl?: string }[] };
      };
    };
    if (json.code !== 200) continue;
    const status = json.data?.status;
    if (status === "SUCCESS") {
      const audioUrl = json.data?.response?.sunoData?.[0]?.audioUrl;
      if (!audioUrl) throw new Error("No audio URL in Suno response");
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error("Failed to download Suno audio");
      let buf: Buffer = Buffer.from(new Uint8Array(await audioRes.arrayBuffer()));
      if (role === "instrumental") {
        buf = await trimAudioToSeconds(buf, MAX_OUTPUT_SEC);
      }
      return await uploadToUploadThing(buf, `${role}-${Date.now()}.mp3`);
    }
    if (
      status === "GENERATE_AUDIO_FAILED" ||
      status === "CREATE_TASK_FAILED" ||
      status === "SENSITIVE_WORD_ERROR" ||
      status === "CALLBACK_EXCEPTION"
    ) {
      const errDetails = JSON.stringify(json, null, 2);
      console.error("[suno] generation failed", { taskId, status, response: json });
      throw new Error(`Suno generation failed: ${status}\n${errDetails}`);
    }
  }
  throw new Error("Suno poll timeout");
}
