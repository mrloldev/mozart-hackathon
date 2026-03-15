import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { workflow } from "./workflow";

const DEFAULT_BEAT_PROMPT = "Create an energetic music battle beat with punchy kick drum, snappy snare, and driving rhythm";

export const beatWorkflow = workflow.define({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    playerId: v.id("players"),
    prompt: v.optional(v.string()),
  },
  handler: async (step, args): Promise<void> => {
    console.log("[beatWorkflow] Started", { roomId: args.roomId, teamId: args.teamId, playerId: args.playerId });
    const elevenLabsPrompt = await step.runAction(
      internal.actions.openRouterPrompt,
      { userPrompt: args.prompt ?? DEFAULT_BEAT_PROMPT },
      { retry: true }
    );
    console.log("[beatWorkflow] OpenRouter prompt generated");

    const fileUrl = await step.runAction(
      internal.actions.elevenLabsComposeAndUpload,
      { prompt: elevenLabsPrompt },
      { retry: true }
    );
    console.log("[beatWorkflow] ElevenLabs composed and uploaded", { fileUrl });

    await step.runMutation(internal.rooms.updateGeneratedAudio, {
      roomId: args.roomId,
      teamId: args.teamId,
      playerId: args.playerId,
      fileUrl,
      role: "beat",
      prompt: args.prompt,
    });
    console.log("[beatWorkflow] Completed");
  },
});

const DEFAULT_MELODY_PROMPT = "Add a beautiful melody with a single instrument";

export const melodyWorkflow = workflow.define({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    playerId: v.id("players"),
    prompt: v.optional(v.string()),
    userRecordingUrl: v.optional(v.string()),
  },
  handler: async (step, args): Promise<void> => {
    console.log("[melodyWorkflow] Started", { roomId: args.roomId, teamId: args.teamId, playerId: args.playerId });
    let sourceUrl: string;

    if (args.userRecordingUrl) {
      sourceUrl = args.userRecordingUrl;
      console.log("[melodyWorkflow] Using user recording as source");
    } else {
      const beatRecording = await step.runQuery(
        internal.rooms.getBeatRecordingForTeam,
        { roomId: args.roomId, teamId: args.teamId }
      );
      if (!beatRecording) throw new Error("No beat recording found for team");
      sourceUrl = beatRecording.fileUrl;
      console.log("[melodyWorkflow] Using beat recording as source");
    }

    const taskId = await step.runAction(
      internal.actions.sunoUploadAndCover,
      {
        uploadUrl: sourceUrl,
        prompt: args.prompt ?? DEFAULT_MELODY_PROMPT,
      },
      { retry: true }
    );
    console.log("[melodyWorkflow] Suno upload and cover started", { taskId });

    const fileUrl = await step.runAction(
      internal.actions.sunoPollDownloadAndUpload,
      { taskId },
      { retry: false }
    );
    console.log("[melodyWorkflow] Suno file downloaded and uploaded", { fileUrl });

    await step.runMutation(internal.rooms.updateGeneratedAudio, {
      roomId: args.roomId,
      teamId: args.teamId,
      playerId: args.playerId,
      fileUrl,
      role: "melody",
      prompt: args.prompt,
    });
    console.log("[melodyWorkflow] Completed");
  },
});

export const startBeatGeneration = mutation({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    playerId: v.id("players"),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    return await workflow.start(ctx, internal.workflows.beatWorkflow, args);
  },
});

export const startMelodyGeneration = mutation({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    playerId: v.id("players"),
    prompt: v.optional(v.string()),
    userRecordingUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    return await workflow.start(ctx, internal.workflows.melodyWorkflow, args);
  },
});
