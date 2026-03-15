import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

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
    isHostPlaying: v.optional(v.boolean()),
    teamName: v.optional(v.string()),
    isClassicMode: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    players: v.optional(
      v.array(
        v.object({
          name: v.string(),
          avatarUrl: v.string(),
          role: v.union(v.literal("beat"), v.literal("melody"), v.literal("vocals")),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const hostIsPlaying = args.isHostPlaying ?? true;
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
      isClassicMode: args.isClassicMode ?? false,
      isPublic: args.isPublic ?? false,
    });

    if (!hostIsPlaying) {
      return { roomId, teamId: null, code };
    }

    const teamName = args.teamName ?? "Team 1";
    const players = args.players ?? [];
    const teamId = await ctx.db.insert("teams", {
      roomId,
      name: teamName,
      teamIndex: 0,
      lastSeen: Date.now(),
      isConnected: true,
    });

    await ctx.db.patch(roomId, { hostTeamId: teamId });

    for (const player of players) {
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
        const [players, recordings] = await Promise.all([
          ctx.db.query("players").withIndex("by_team", (q) => q.eq("teamId", team._id)).collect(),
          ctx.db
            .query("recordings")
            .withIndex("by_room_team_role", (q) =>
              q.eq("roomId", room._id).eq("teamId", team._id)
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
          players.map(async (p) => {
            let url = p.recordingUrl ?? recordingsByRole[p.role] ?? null;
            if (!url && p.recordingStorageId) {
              url = await ctx.storage.getUrl(p.recordingStorageId as any);
            }
            return { ...p, recordingUrl: url };
          })
        );
        const trackUrls = (["beat", "melody", "vocals"] as const).map(
          (role) => recordingsByRole[role] ?? playersWithUrls.find((p) => p.role === role)?.recordingUrl ?? null
        );
        return { ...team, players: playersWithUrls, trackUrls };
      })
    );

    let song = null;
    if (room.songId) {
      const songDoc = await ctx.db.get(room.songId);
      if (songDoc) {
        let audioUrl = songDoc.fileUrl ?? null;
        if (!audioUrl && songDoc.storageId) {
          audioUrl = await ctx.storage.getUrl(songDoc.storageId as any);
        }
        song = { ...songDoc, audioUrl };
      }
    }

    return {
      ...room,
      teams: teamsWithPlayers.sort((a, b) => a.teamIndex - b.teamIndex),
      song,
    };
  },
});

export const getLiveRooms = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const playingRooms = await ctx.db
      .query("rooms")
      .withIndex("by_phase_createdAt", (q: any) =>
        q.eq("phase", "playing").gt("createdAt", cutoff)
      )
      .order("desc")
      .take(30);
    const live: { code: string; phase: string; isPublic?: boolean; createdAt: number }[] = [];
    for (const room of playingRooms) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_room", (q: any) => q.eq("roomId", room._id))
        .collect();
      const bothConnected = teams.length === 2 && teams.every((t) => t.isConnected !== false);
      if (bothConnected) {
        live.push({
          code: room.code,
          phase: room.phase,
          isPublic: room.isPublic,
          createdAt: room.createdAt,
        });
      }
    }
    return live.slice(0, 10);
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

    let song = null;
    if (room.songId) {
      const songDoc = await ctx.db.get(room.songId);
      if (songDoc) {
        let audioUrl = songDoc.fileUrl ?? null;
        if (!audioUrl && songDoc.storageId) {
          audioUrl = await ctx.storage.getUrl(songDoc.storageId as any);
        }
        song = { ...songDoc, audioUrl };
      }
    }

    return {
      ...room,
      teams: teamsWithPlayers.sort((a, b) => a.teamIndex - b.teamIndex),
      song,
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

    let songId = room.songId;
    if (room.isClassicMode && !songId) {
      const songs = await ctx.db.query("songs").collect();
      if (songs.length > 0) {
        const random = songs[Math.floor(Math.random() * songs.length)];
        songId = random._id;
      }
    }

    await ctx.db.patch(args.roomId, {
      phase: "playing",
      ...(songId ? { songId } : {}),
    });
  },
});

export const recordComplete = mutation({
  args: {
    playerId: v.id("players"),
    roomId: v.id("rooms"),
    fileUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    await ctx.db.patch(args.playerId, {
      hasRecorded: true,
      ...(args.fileUrl ? { recordingUrl: args.fileUrl } : {}),
    });

    if (args.fileUrl) {
      await ctx.db.insert("recordings", {
        roomId: args.roomId,
        teamId: player.teamId,
        playerId: args.playerId,
        fileUrl: args.fileUrl,
        role: player.role,
        createdAt: Date.now(),
      });
    }

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

function advanceTurn(ctx: any, roomId: string, room: any) {
  const roles = ["beat", "melody", "vocals"] as const;
  let { currentRoleIndex, currentTeamTurn } = room;
  if (currentTeamTurn === 0) {
    currentTeamTurn = 1;
  } else {
    currentTeamTurn = 0;
    if (currentRoleIndex < roles.length - 1) {
      currentRoleIndex++;
    } else {
      return ctx.db.patch(roomId, { phase: "results" });
    }
  }
  return ctx.db.patch(roomId, { currentRoleIndex, currentTeamTurn });
}

export const skipTurn = mutation({
  args: {
    playerId: v.id("players"),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    await ctx.db.patch(args.playerId, { hasRecorded: true });
    await advanceTurn(ctx, args.roomId, room);
  },
});

export const getBeatRecordingForTeam = internalQuery({
  args: { roomId: v.id("rooms"), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const recording = await ctx.db
      .query("recordings")
      .withIndex("by_room_team_role", (q) =>
        q.eq("roomId", args.roomId).eq("teamId", args.teamId).eq("role", "beat")
      )
      .first();
    if (!recording) return null;
    let url = recording.fileUrl ?? null;
    if (!url && recording.storageId) {
      url = await ctx.storage.getUrl(recording.storageId as any);
    }
    return { ...recording, fileUrl: url ?? "" };
  },
});

export const aiGenerationComplete = internalMutation({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    playerId: v.id("players"),
    fileUrl: v.string(),
    role: v.union(v.literal("beat"), v.literal("melody")),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, {
      hasRecorded: true,
      recordingUrl: args.fileUrl,
    });

    await ctx.db.insert("recordings", {
      roomId: args.roomId,
      teamId: args.teamId,
      playerId: args.playerId,
      fileUrl: args.fileUrl,
      role: args.role,
      prompt: args.prompt,
      createdAt: Date.now(),
    });

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

export const updateGeneratedAudio = internalMutation({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    playerId: v.id("players"),
    fileUrl: v.string(),
    role: v.union(v.literal("beat"), v.literal("melody")),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, { recordingUrl: args.fileUrl });

    const existing = await ctx.db
      .query("recordings")
      .withIndex("by_room_team_role", (q) =>
        q.eq("roomId", args.roomId).eq("teamId", args.teamId).eq("role", args.role)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { fileUrl: args.fileUrl, prompt: args.prompt });
    } else {
      await ctx.db.insert("recordings", {
        roomId: args.roomId,
        teamId: args.teamId,
        playerId: args.playerId,
        fileUrl: args.fileUrl,
        role: args.role,
        prompt: args.prompt,
        createdAt: Date.now(),
      });
    }
  },
});

export const updateGeneratedInstrumental = internalMutation({
  args: {
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    fileUrl: v.string(),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const p of players) {
      if (p.role === "beat" || p.role === "melody") {
        await ctx.db.patch(p._id, { recordingUrl: args.fileUrl });
      }
    }

    for (const role of ["beat", "melody"] as const) {
      const existing = await ctx.db
        .query("recordings")
        .withIndex("by_room_team_role", (q) =>
          q.eq("roomId", args.roomId).eq("teamId", args.teamId).eq("role", role)
        )
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { fileUrl: args.fileUrl, prompt: args.prompt });
      } else {
        const beatPlayer = players.find((p) => p.role === "beat");
        const melodyPlayer = players.find((p) => p.role === "melody");
        const playerId = role === "beat" ? beatPlayer?._id : melodyPlayer?._id;
        if (playerId) {
          await ctx.db.insert("recordings", {
            roomId: args.roomId,
            teamId: args.teamId,
            playerId,
            fileUrl: args.fileUrl,
            role,
            prompt: args.prompt,
            createdAt: Date.now(),
          });
        }
      }
    }
  },
});

const playerArg = v.object({
  name: v.string(),
  avatarUrl: v.string(),
  role: v.union(v.literal("beat"), v.literal("melody"), v.literal("vocals")),
});

export const createLocalRoom = mutation({
  args: {
    team1Name: v.string(),
    team1Players: v.array(playerArg),
    team2Name: v.string(),
    team2Players: v.array(playerArg),
    songId: v.optional(v.id("songs")),
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
      phase: "playing",
      currentRoleIndex: 0,
      currentTeamTurn: 0,
      createdAt: Date.now(),
      isClassicMode: false,
      songId: args.songId,
    });

    const team1Id = await ctx.db.insert("teams", {
      roomId,
      name: args.team1Name,
      teamIndex: 0,
      lastSeen: Date.now(),
      isConnected: true,
    });
    await ctx.db.patch(roomId, { hostTeamId: team1Id });
    for (const p of args.team1Players) {
      await ctx.db.insert("players", { teamId: team1Id, ...p, hasRecorded: false });
    }

    const team2Id = await ctx.db.insert("teams", {
      roomId,
      name: args.team2Name,
      teamIndex: 1,
      lastSeen: Date.now(),
      isConnected: true,
    });
    for (const p of args.team2Players) {
      await ctx.db.insert("players", { teamId: team2Id, ...p, hasRecorded: false });
    }

    return { roomId, code, team1Id, team2Id };
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
        await ctx.db.patch(player._id, {
          hasRecorded: false,
          ...(player.recordingUrl ? { recordingUrl: undefined } : {}),
        });
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
