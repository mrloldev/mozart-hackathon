import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  songs: defineTable({
    title: v.string(),
    lyrics: v.string(),
    fileUrl: v.optional(v.string()),
    storageId: v.optional(v.any()),
    createdAt: v.number(),
  }),

  rooms: defineTable({
    code: v.string(),
    hostTeamId: v.string(),
    isClassicMode: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    singlePlay: v.optional(v.boolean()),
    songId: v.optional(v.id("songs")),
    phase: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("results")
    ),
    currentRoleIndex: v.number(),
    currentTeamTurn: v.number(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_phase_createdAt", ["phase", "createdAt"]),

  teams: defineTable({
    roomId: v.id("rooms"),
    name: v.string(),
    teamIndex: v.number(),
    lastSeen: v.optional(v.number()),
    isConnected: v.optional(v.boolean()),
  }).index("by_room", ["roomId"]),

  players: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    avatarUrl: v.string(),
    role: v.union(v.literal("beat"), v.literal("melody"), v.literal("vocals")),
    hasRecorded: v.boolean(),
    recordingUrl: v.optional(v.string()),
    recordingStorageId: v.optional(v.any()),
  }).index("by_team", ["teamId"]),

  recordings: defineTable({
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    playerId: v.id("players"),
    fileUrl: v.optional(v.string()),
    storageId: v.optional(v.any()),
    role: v.union(v.literal("beat"), v.literal("melody"), v.literal("vocals")),
    prompt: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_player", ["playerId"])
    .index("by_room_team_role", ["roomId", "teamId", "role"]),

  generations: defineTable({
    roomId: v.id("rooms"),
    teamId: v.id("teams"),
    type: v.union(v.literal("instrumental"), v.literal("vocals"), v.literal("combined_mix")),
    fileUrl: v.string(),
    prompt: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_room_team", ["roomId", "teamId"])
    .index("by_room_team_type", ["roomId", "teamId", "type"]),

  audience: defineTable({
    roomId: v.id("rooms"),
    sessionId: v.string(),
    name: v.optional(v.string()),
    lastSeen: v.number(),
    isConnected: v.boolean(),
  }).index("by_room", ["roomId"]),

  votes: defineTable({
    roomId: v.id("rooms"),
    sessionId: v.string(),
    teamId: v.id("teams"),
    updatedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_session_room", ["sessionId", "roomId"]),

  emotes: defineTable({
    roomId: v.id("rooms"),
    sessionId: v.string(),
    type: v.string(),
    teamId: v.optional(v.id("teams")),
    createdAt: v.number(),
  }).index("by_room_time", ["roomId", "createdAt"]),
});
