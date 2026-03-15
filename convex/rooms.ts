import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const createRoom = mutation({
  args: {
    teamName: v.string(),
    players: v.array(
      v.object({
        name: v.string(),
        avatarUrl: v.string(),
        role: v.union(v.literal("beat"), v.literal("melody"), v.literal("vocals")),
      })
    ),
  },
  handler: async (ctx, args) => {
    let code = generateRoomCode();
    let existing = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    while (existing) {
      code = generateRoomCode();
      existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostTeamId: "",
      phase: "waiting",
      currentRoleIndex: 0,
      currentTeamTurn: 0,
      createdAt: Date.now(),
    });

    const teamId = await ctx.db.insert("teams", {
      roomId,
      name: args.teamName,
      teamIndex: 0,
      lastSeen: Date.now(),
      isConnected: true,
    });

    await ctx.db.patch(roomId, { hostTeamId: teamId });

    for (const player of args.players) {
      await ctx.db.insert("players", {
        teamId,
        name: player.name,
        avatarUrl: player.avatarUrl,
        role: player.role,
        hasRecorded: false,
      });
    }

    return { roomId, teamId, code };
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
    teamName: v.string(),
    players: v.array(
      v.object({
        name: v.string(),
        avatarUrl: v.string(),
        role: v.union(v.literal("beat"), v.literal("melody"), v.literal("vocals")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    const existingTeams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    if (existingTeams.length >= 2) {
      throw new Error("Room is full");
    }

    if (room.phase !== "waiting") {
      throw new Error("Game already started");
    }

    const teamId = await ctx.db.insert("teams", {
      roomId: room._id,
      name: args.teamName,
      teamIndex: 1,
      lastSeen: Date.now(),
      isConnected: true,
    });

    for (const player of args.players) {
      await ctx.db.insert("players", {
        teamId,
        name: player.name,
        avatarUrl: player.avatarUrl,
        role: player.role,
        hasRecorded: false,
      });
    }

    return { roomId: room._id, teamId };
  },
});

export const getRoom = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!room) return null;

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    const teamsWithPlayers = await Promise.all(
      teams.map(async (team) => {
        const players = await ctx.db
          .query("players")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        return { ...team, players };
      })
    );

    return {
      ...room,
      teams: teamsWithPlayers.sort((a, b) => a.teamIndex - b.teamIndex),
    };
  },
});

export const getRoomById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    const teamsWithPlayers = await Promise.all(
      teams.map(async (team) => {
        const players = await ctx.db
          .query("players")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        return { ...team, players };
      })
    );

    return {
      ...room,
      teams: teamsWithPlayers.sort((a, b) => a.teamIndex - b.teamIndex),
    };
  },
});

export const startGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (teams.length < 2) {
      throw new Error("Need 2 teams to start");
    }

    await ctx.db.patch(args.roomId, { phase: "playing" });
  },
});

export const recordComplete = mutation({
  args: { playerId: v.id("players"), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, { hasRecorded: true });

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    teams.sort((a, b) => a.teamIndex - b.teamIndex);

    const roles = ["beat", "melody", "vocals"] as const;
    let { currentRoleIndex, currentTeamTurn } = room;

    if (currentTeamTurn === 0) {
      currentTeamTurn = 1;
    } else {
      currentTeamTurn = 0;
      if (currentRoleIndex < roles.length - 1) {
        currentRoleIndex++;
      } else {
        await ctx.db.patch(args.roomId, { phase: "results" });
        return;
      }
    }

    await ctx.db.patch(args.roomId, { currentRoleIndex, currentTeamTurn });
  },
});

export const updateTeamName = mutation({
  args: { teamId: v.id("teams"), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.teamId, { name: args.name });
  },
});

export const updatePlayerName = mutation({
  args: { playerId: v.id("players"), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, { name: args.name });
  },
});

export const resetRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const team of teams) {
      const players = await ctx.db
        .query("players")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();

      for (const player of players) {
        await ctx.db.patch(player._id, { hasRecorded: false });
      }
    }

    await ctx.db.patch(args.roomId, {
      phase: "waiting",
      currentRoleIndex: 0,
      currentTeamTurn: 0,
    });
  },
});

export const heartbeat = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return;
    await ctx.db.patch(args.teamId, {
      lastSeen: Date.now(),
      isConnected: true,
    });
  },
});

export const leaveRoom = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return;
    await ctx.db.patch(args.teamId, {
      isConnected: false,
    });
  },
});
