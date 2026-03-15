"use node";

/**
 * Centralized Suno API + UploadThing integration.
 *
 * For Suno upload-cover, the uploadUrl must be a publicly accessible URL of
 * the source audio. We get this from UploadThing after storing files:
 * uploadToUploadThing() returns the ufsUrl — pass that as uploadUrl to Suno.
 */
import { UTApi } from "uploadthing/server";

const SUNO_BASE = "https://api.kie.ai/api/v1";
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

const INSTRUMENTAL_PROMPT = `The source is a combined beat (drums) + rhythm/melody mix. Track it second by second. Output must match the reference temporally for production-quality result.

Critical: Match the source timeline exactly. Every second of your output must correspond to the same moment in the source. No stretching, compressing, or reordering.

- Beat/rhythm: Align every kick, snare, hi-hat with source timing. Preserve groove and swing.
- Melody: Mirror note placement, phrasing, dynamics second by second.
- Structure: Same sections, transitions, build-ups as source. No added or removed bars.
- Production: Crisp drums (punchy kick, snappy snare), clear melodic instrument (guitar or piano). Instrumental only, no vocals.
- Goal: Professional studio version of this exact reference—temporal clone, not reinterpretation.`;

type CoverRole = "beat" | "melody" | "instrumental";

function getCoverParams(role: CoverRole): { prompt: string; style: string; title: string } {
  if (role === "beat") return { prompt: BEAT_STYLE, style: BEAT_STYLE, title: "Beat" };
  if (role === "instrumental")
    return { prompt: INSTRUMENTAL_PROMPT, style: INSTRUMENTAL_STYLE, title: "Instrumental" };
  return { prompt: MELODY_PROMPT, style: MELODY_STYLE, title: "Melody" };
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
  const { prompt, style, title } = getCoverParams(role);
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
      instrumental: true,
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
  role: "beat" | "melody" | "instrumental" = "melody"
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
      const buf = Buffer.from(await audioRes.arrayBuffer());
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
