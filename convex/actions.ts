"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import * as suno from "./lib/suno";
import * as fal from "./lib/fal";

function getSunoApiKey(): string {
  const key = process.env.SUNO_API_KEY;
  if (!key) throw new Error("SUNO_API_KEY not set");
  return key;
}

export const sunoUploadAndCover = internalAction({
  args: {
    uploadUrl: v.string(),
    role: v.optional(v.union(v.literal("beat"), v.literal("melody"), v.literal("instrumental"), v.literal("vocals"))),
  },
  handler: async (_ctx, args) => {
    return await suno.sunoUploadAndCover(
      getSunoApiKey(),
      args.uploadUrl,
      args.role ?? "melody"
    );
  },
});

export const sunoPollDownloadAndUpload = internalAction({
  args: {
    taskId: v.string(),
    role: v.optional(v.union(v.literal("beat"), v.literal("melody"), v.literal("instrumental"), v.literal("vocals"))),
  },
  handler: async (_ctx, args) => {
    return await suno.sunoPollAndUpload(
      getSunoApiKey(),
      args.taskId,
      args.role ?? "melody"
    );
  },
});

export const falComposeAudio = internalAction({
  args: {
    instrumentalUrl: v.string(),
    vocalsUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    return await fal.falComposeAndUpload(args.instrumentalUrl, args.vocalsUrl);
  },
});
