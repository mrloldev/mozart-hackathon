import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

export const joinAsAudience = mutation({
  args: {
    code: v.string(),
    sessionId: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!room) throw new Error("Room not found");

    const existing = await ctx.db
      .query("audience")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: now,
        isConnected: true,
        ...(args.name !== undefined ? { name: args.name } : {}),
      });
    } else {
      await ctx.db.insert("audience", {
        roomId: room._id,
        sessionId: args.sessionId,
        name: args.name,
        lastSeen: now,
        isConnected: true,
      });
    }

    return { roomId: room._id };
  },
});

export const audienceHeartbeat = mutation({
  args: { sessionId: v.string(), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("audience")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    if (!member) return;
    await ctx.db.patch(member._id, { lastSeen: Date.now(), isConnected: true });
  },
});

export const leaveAudience = mutation({
  args: { sessionId: v.string(), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("audience")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    if (!member) return;
    await ctx.db.patch(member._id, { isConnected: false });
  },
});

export const castVote = mutation({
  args: {
    sessionId: v.string(),
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_session_room", (q) =>
        q.eq("sessionId", args.sessionId).eq("roomId", args.roomId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { teamId: args.teamId, updatedAt: now });
    } else {
      await ctx.db.insert("votes", {
        roomId: args.roomId,
        sessionId: args.sessionId,
        teamId: args.teamId,
        updatedAt: now,
      });
    }
  },
});

const EMOTE_TYPES = ["tomato", "fire", "heart", "clap", "skull"] as const;

export const sendEmote = mutation({
  args: {
    sessionId: v.string(),
    roomId: v.id("rooms"),
    teamId: v.optional(v.id("teams")),
    type: v.union(
      v.literal("tomato"),
      v.literal("fire"),
      v.literal("heart"),
      v.literal("clap"),
      v.literal("skull"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emotes", {
      roomId: args.roomId,
      sessionId: args.sessionId,
      type: args.type,
      teamId: args.teamId,
      createdAt: Date.now(),
    });
  },
});

async function getRoomWithTeams(ctx: any, roomId: Id<"rooms">) {
  const room = await ctx.db.get(roomId);
  if (!room) return null;

  const teams = await ctx.db
    .query("teams")
    .withIndex("by_room", (q: any) => q.eq("roomId", roomId))
    .collect();

  const teamsWithPlayers = await Promise.all(
    teams.map(async (team: any) => {
      const [players, recordings] = await Promise.all([
        ctx.db.query("players").withIndex("by_team", (q: any) => q.eq("teamId", team._id)).collect(),
        ctx.db
          .query("recordings")
          .withIndex("by_room_team_role", (q: any) =>
            q.eq("roomId", roomId).eq("teamId", team._id)
          )
          .collect(),
      ]);

      const recordingsByRole: Record<string, string | null> = {};
      for (const r of recordings) {
        let url = r.fileUrl ?? null;
        if (!url && r.storageId) {
          url = await ctx.storage.getUrl(r.storageId as any);
        }
        if (url) recordingsByRole[r.role] = url;
      }

      const playersWithUrls = await Promise.all(
        players.map(async (p: any) => {
          let url = p.recordingUrl ?? recordingsByRole[p.role] ?? null;
          if (!url && p.recordingStorageId) {
            url = await ctx.storage.getUrl(p.recordingStorageId as any);
          }
          return { ...p, recordingUrl: url };
        }),
      );
      const trackUrls = (["beat", "melody", "vocals"] as const).map(
        (role) =>
          recordingsByRole[role] ?? playersWithUrls.find((p: any) => p.role === role)?.recordingUrl ?? null
      );
      return { ...team, players: playersWithUrls, trackUrls };
    }),
  );

  let song = null;
  if (room.songId) {
    const songDoc = await ctx.db.get(room.songId);
    if (songDoc) {
      let audioUrl = (songDoc as any).fileUrl ?? null;
      if (!audioUrl && (songDoc as any).storageId) {
        audioUrl = await ctx.storage.getUrl((songDoc as any).storageId);
      }
      song = { ...songDoc, audioUrl };
    }
  }

  return {
    ...room,
    teams: teamsWithPlayers.sort((a: any, b: any) => a.teamIndex - b.teamIndex),
    song,
  };
}

export const getAudienceRoom = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!room) return null;

    const roomData = await getRoomWithTeams(ctx, room._id);
    if (!roomData) return null;

    const audienceMembers = await ctx.db
      .query("audience")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .filter((q) => q.eq(q.field("isConnected"), true))
      .collect();
    const audienceCount = audienceMembers.length;

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    const voteTally: Record<string, number> = {};
    for (const vote of votes) {
      voteTally[vote.teamId] = (voteTally[vote.teamId] ?? 0) + 1;
    }

    return {
      ...roomData,
      audienceCount,
      voteTally,
    };
  },
});

export const getVoteTally = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const tally: Record<string, number> = {};
    for (const v of votes) {
      const id = v.teamId;
      tally[id] = (tally[id] ?? 0) + 1;
    }
    return tally;
  },
});

export const getMyVote = query({
  args: { sessionId: v.string(), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_session_room", (q) =>
        q.eq("sessionId", args.sessionId).eq("roomId", args.roomId),
      )
      .first();
    return vote?.teamId ?? null;
  },
});

export const getRecentEmotes = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - 5000;
    const emotes = await ctx.db
      .query("emotes")
      .withIndex("by_room_time", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .order("desc")
      .take(50);
    return emotes.reverse();
  },
});

export const getAudienceCount = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("audience")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isConnected"), true))
      .collect();
    return members.length;
  },
});

export const cleanOldEmotes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 60000;
    const old = await ctx.db
      .query("emotes")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();
    for (const e of old) {
      await ctx.db.delete(e._id);
    }
  },
});
