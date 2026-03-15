import { internalMutation } from "./_generated/server";

export const migrateToUploadThing = internalMutation({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    for (const player of players) {
      const doc = player as Record<string, unknown>;
      if ("recordingStorageId" in doc && doc.recordingStorageId) {
        const url = await ctx.storage.getUrl(doc.recordingStorageId as any);
        await ctx.db.patch(player._id, {
          recordingUrl: url ?? undefined,
          recordingStorageId: undefined,
        } as any);
      }
    }

    const recordings = await ctx.db.query("recordings").collect();
    for (const recording of recordings) {
      const doc = recording as Record<string, unknown>;
      if ("storageId" in doc && doc.storageId && !("fileUrl" in doc)) {
        const url = await ctx.storage.getUrl(doc.storageId as any);
        if (url) {
          await ctx.db.patch(recording._id, {
            fileUrl: url,
            storageId: undefined,
          } as any);
        } else {
          await ctx.db.delete(recording._id);
        }
      }
    }

    const songs = await ctx.db.query("songs").collect();
    for (const song of songs) {
      const doc = song as Record<string, unknown>;
      if ("storageId" in doc && doc.storageId && !("fileUrl" in doc)) {
        const url = await ctx.storage.getUrl(doc.storageId as any);
        if (url) {
          await ctx.db.patch(song._id, {
            fileUrl: url,
            storageId: undefined,
          } as any);
        } else {
          await ctx.db.delete(song._id);
        }
      }
    }

    return "Migration complete";
  },
});
