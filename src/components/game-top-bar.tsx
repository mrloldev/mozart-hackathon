"use client";

import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLES } from "@/constants/game";

export default function GameTopBar({
  currentRoleIndex,
  currentTeamName,
  audienceCount,
}: {
  currentRoleIndex: number;
  currentTeamName?: string;
  audienceCount?: number;
}) {
  const currentRole = ROLES[currentRoleIndex];

  return (
    <div className="flex items-center gap-3">
      {/* Current role label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRole.id}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
            <currentRole.Icon size={14} strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-sm font-black uppercase tracking-wider text-white">
              {currentRole.label}
            </span>
            {currentTeamName && (
              <span className="ml-1.5 text-[10px] font-medium text-white/30">{currentTeamName}</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress steps — compact */}
      <div className="flex items-center gap-0.5">
        {ROLES.map((role, index) => {
          const RoleIcon = role.Icon;
          const isActive = index === currentRoleIndex;
          const isDone = index < currentRoleIndex;
          return (
            <div key={role.id} className="flex items-center">
              <motion.div
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                  isActive
                    ? "bg-cyan-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                    : isDone
                      ? "bg-emerald-500/80 text-white"
                      : "bg-white/[0.06] text-white/25"
                }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={isActive ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
              >
                {isDone ? (
                  <Check size={12} strokeWidth={2.5} />
                ) : (
                  <RoleIcon size={12} strokeWidth={2.5} />
                )}
              </motion.div>
              {index < ROLES.length - 1 && (
                <div className="h-0.5 w-2 sm:w-3">
                  <div className={`h-full rounded-full ${isDone ? "bg-emerald-500/60" : "bg-white/[0.06]"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {audienceCount !== undefined && audienceCount > 0 && (
        <span className="ml-1 hidden text-[10px] text-white/25 sm:inline">
          {audienceCount} watching
        </span>
      )}
    </div>
  );
}
