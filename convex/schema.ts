import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    hostTeamId: v.string(),
    phase: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("results")
    ),
    currentRoleIndex: v.number(),
    currentTeamTurn: v.number(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

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
  }).index("by_team", ["teamId"]),
});
