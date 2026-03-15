import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    return songs.map((s) => ({
      _id: s._id,
      title: s.title,
      lyrics: s.lyrics,
      createdAt: s.createdAt,
      url: s.fileUrl ?? null,
    }));
  },
});

export const listWithUrls = query({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    return await Promise.all(
      songs.map(async (s) => {
        let url = s.fileUrl ?? null;
        if (!url && s.storageId) {
          url = await ctx.storage.getUrl(s.storageId as any);
        }
        return {
          _id: s._id,
          title: s.title,
          lyrics: s.lyrics,
          createdAt: s.createdAt,
          url,
        };
      })
    );
  },
});

export const getCount = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("songs").collect()).length,
});

export const getRandom = query({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    if (songs.length === 0) return null;
    const song = songs[Math.floor(Math.random() * songs.length)];
    let audioUrl = song.fileUrl ?? null;
    if (!audioUrl && song.storageId) {
      audioUrl = await ctx.storage.getUrl(song.storageId as any);
    }
    return { ...song, audioUrl };
  },
});

export const get = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const song = await ctx.db.get(args.songId);
    if (!song) return null;
    let url = song.fileUrl ?? null;
    if (!url && song.storageId) {
      url = await ctx.storage.getUrl(song.storageId as any);
    }
    return { ...song, url };
  },
});
