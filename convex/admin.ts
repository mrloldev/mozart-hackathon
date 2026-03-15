import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_PASSWORD = "remixbattle2025";

function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export const verifyAdmin = mutation({
  args: { password: v.string() },
  handler: (_, args) => verifyPassword(args.password),
});

export const addSong = mutation({
  args: {
    password: v.string(),
    title: v.string(),
    lyrics: v.string(),
    fileUrl: v.string(),
  },
  handler: async (ctx, args) => {
    if (!verifyPassword(args.password)) {
      throw new Error("Invalid password");
    }
    await ctx.db.insert("songs", {
      title: args.title,
      lyrics: args.lyrics,
      fileUrl: args.fileUrl,
      createdAt: Date.now(),
    });
  },
});

export const listSongs = query({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    if (!verifyPassword(args.password)) {
      throw new Error("Invalid password");
    }
    return await ctx.db.query("songs").order("desc").collect();
  },
});

export const updateSong = mutation({
  args: {
    password: v.string(),
    songId: v.id("songs"),
    title: v.optional(v.string()),
    lyrics: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!verifyPassword(args.password)) {
      throw new Error("Invalid password");
    }
    const song = await ctx.db.get(args.songId);
    if (!song) throw new Error("Song not found");
    const updates: { title?: string; lyrics?: string } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.lyrics !== undefined) updates.lyrics = args.lyrics;
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.songId, updates);
    }
  },
});

export const deleteSong = mutation({
  args: {
    password: v.string(),
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    if (!verifyPassword(args.password)) {
      throw new Error("Invalid password");
    }
    const song = await ctx.db.get(args.songId);
    if (song) {
      await ctx.db.delete(args.songId);
    }
  },
});
