import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { workflow } from "./workflow";

export const instrumentalWorkflow = workflow.define({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    melodyPlayerId: v.id("players"),
    prompt: v.optional(v.string()),
    mixedAudioUrl: v.string(),
  },
  handler: async (step, args): Promise<void> => {
    console.log("[instrumentalWorkflow] Started", {
      roomId: args.roomId,
      teamId: args.teamId,
      melodyPlayerId: args.melodyPlayerId,
    });

    const taskId = await step.runAction(
      internal.actions.sunoUploadAndCover,
      { uploadUrl: args.mixedAudioUrl, role: "instrumental" },
      { retry: true }
    );
    console.log("[instrumentalWorkflow] Suno instrumental generation started", { taskId });

    const fileUrl = await step.runAction(
      internal.actions.sunoPollDownloadAndUpload,
      { taskId, role: "instrumental" },
      { retry: false }
    );
    console.log("[instrumentalWorkflow] Suno instrumental downloaded and uploaded", { fileUrl });

    await step.runMutation(internal.rooms.updateGeneratedInstrumental, {
      roomId: args.roomId,
      teamId: args.teamId,
      fileUrl,
      prompt: args.prompt,
    });
    console.log("[instrumentalWorkflow] Completed");
  },
});

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
      { uploadUrl: sourceUrl, role: "melody" },
      { retry: true }
    );
    console.log("[melodyWorkflow] Suno upload and cover started", { taskId });

    const fileUrl = await step.runAction(
      internal.actions.sunoPollDownloadAndUpload,
      { taskId, role: "melody" },
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

export const startInstrumentalGeneration = mutation({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    melodyPlayerId: v.id("players"),
    prompt: v.optional(v.string()),
    mixedAudioUrl: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    return await workflow.start(ctx, internal.workflows.instrumentalWorkflow, args);
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
