"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { UTApi } from "uploadthing/server";

function getUtapi() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) throw new Error("UPLOADTHING_TOKEN not set");
  return new UTApi({ token });
}

async function uploadBufferToUploadThing(buffer: Buffer, filename: string): Promise<string> {
  const utapi = getUtapi();
  const file = new File([new Uint8Array(buffer)], filename, { type: "audio/mpeg" });
  const response = await utapi.uploadFiles(file);
  if (response.error) {
    throw new Error(`UploadThing upload failed: ${response.error.message}`);
  }
  return response.data.ufsUrl;
}

const BEAT_SYSTEM_PROMPT = `You are an Expert AI Audio Prompt Engineer specializing in highly technical text-to-audio generation prompts. Your task is to translate user inputs (such as onomatopoeia, lyrics, or vague musical descriptions) into precise, structured, second-by-second audio generation prompts.

Always adhere to the following strict formatting and technical rules. Keep the final output under 1000 characters.

**RULES:**
1. **Header Formulation:** Always start by defining the overall arrangement: Instrument(s), exact BPM, and time signature (e.g., 4/4 time).
2. **The Variable System:** If the audio is repetitive, mathematically break it down into a Variables section.
   - Label them (e.g., V1, V2 for rhythms, or M1, M2 for melodies).
   - Define the exact rhythmic subdivisions (e.g., 8th notes, 16th-note triplets).
   - Define the specific musical notes (e.g., C2, A4) and their corresponding acoustic frequencies in Hz (e.g., ~60Hz for kicks, ~10kHz for hi-hats).
   - Include the phonetic or descriptive equivalent in parentheses.
3. **The Timeline:** Create a strict, second-by-second chronological breakdown (e.g., **00:00-00:04:**). Describe exactly when variables are triggered.
4. **Dynamic & Acoustic Nuances:** Detail performance dynamics (e.g., staccato, legato, rubato, velocity, syncopation) and acoustic characteristics (e.g., dry mix, zero reverb, close-miced, background vocals at 1kHz-2kHz).

**REQUIRED OUTPUT TEMPLATE:**
Generate a [genre/instrument] track at ~[BPM] in [Time Signature] using the following variables.

**Variables:**
[Variable Name]: [Subdivision] [Description/Instrument] ([Notes], [Frequencies]). *(Phonetic/Lyric reference)*

**Timeline:**
**[Start Time]-[End Time]:** Play [Variable]. [Add specific performance instructions, dynamics, or background elements].

[Final sentence detailing the mix, e.g., "Raw, dry tone with zero reverb."]`;

export const openRouterPrompt = internalAction({
  args: { userPrompt: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: BEAT_SYSTEM_PROMPT },
          { role: "user", content: args.userPrompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter error: ${await res.text()}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";
    return content.slice(0, 1000);
  },
});

export const elevenLabsComposeAndUpload = internalAction({
  args: { prompt: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

    const res = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: args.prompt,
        force_instrumental: true,
        model_id: "music_v1",
      }),
    });

    if (!res.ok) throw new Error(`ElevenLabs error: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return await uploadBufferToUploadThing(buf, `beat-${Date.now()}.mp3`);
  },
});

export const sunoUploadAndCover = internalAction({
  args: {
    uploadUrl: v.string(),
    prompt: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) throw new Error("SUNO_API_KEY not set");

    const fullPrompt = `${args.prompt}. Use a single instrument only. Focus on melody.`;
    const res = await fetch("https://api.kie.ai/api/v1/generate/upload-cover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        uploadUrl: args.uploadUrl,
        prompt: fullPrompt,
        style: "Instrumental melody",
        title: "Melody",
        customMode: true,
        instrumental: true,
        model: "V5",
        audioWeight: 1,
      }),
    });

    if (!res.ok) throw new Error(`Suno error: ${await res.text()}`);
    const json = (await res.json()) as { code?: number; data?: { taskId?: string }; msg?: string };
    if (json.code !== 200) throw new Error(json.msg ?? "Suno request failed");
    const taskId = json.data?.taskId;
    if (!taskId) throw new Error("No taskId from Suno");
    return taskId;
  },
});

export const sunoPollDownloadAndUpload = internalAction({
  args: { taskId: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) throw new Error("SUNO_API_KEY not set");

    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const res = await fetch(
        `https://api.kie.ai/api/v1/generate/record-info?taskId=${encodeURIComponent(args.taskId)}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      if (!res.ok) continue;
      const json = (await res.json()) as { code?: number; data?: { status?: string; response?: { sunoData?: { audioUrl?: string }[] } } };
      if (json.code !== 200) continue;
      const status = json.data?.status;
      if (status === "SUCCESS") {
        const audioUrl = json.data?.response?.sunoData?.[0]?.audioUrl;
        if (!audioUrl) throw new Error("No audio URL in Suno response");
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) throw new Error("Failed to download Suno audio");
        const buf = Buffer.from(await audioRes.arrayBuffer());
        return await uploadBufferToUploadThing(buf, `melody-${Date.now()}.mp3`);
      }
      if (status === "GENERATE_AUDIO_FAILED" || status === "CREATE_TASK_FAILED" || status === "SENSITIVE_WORD_ERROR" || status === "CALLBACK_EXCEPTION") {
        throw new Error(`Suno generation failed: ${status}`);
      }
    }
    throw new Error("Suno poll timeout");
  },
});
