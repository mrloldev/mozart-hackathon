import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("clean old emotes", { minutes: 1 }, internal.audience.cleanOldEmotes);
export default crons;
