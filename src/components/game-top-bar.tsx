"use client";

import { Check } from "@phosphor-icons/react";
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
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
      <motion.div
        className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/60"
        key={currentRoleIndex}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {currentRoleIndex + 1}/{ROLES.length}
      </motion.div>

      <div className="flex items-center gap-0.5">
        {ROLES.map((role, index) => {
          const RoleIcon = role.Icon;
          return (
            <div key={role.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center transition-all md:h-10 md:w-10 ${
                  index === currentRoleIndex
                    ? "bg-[var(--accent-primary)] text-white"
                    : index < currentRoleIndex
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white/30"
                }`}
              >
                {index < currentRoleIndex ? (
                  <Check size={16} weight="bold" />
                ) : (
                  <RoleIcon size={16} weight="bold" />
                )}
              </div>
              {index < ROLES.length - 1 && (
                <div className="h-0.5 w-3 bg-white/10">
                  {index < currentRoleIndex && (
                    <div className="h-full w-full bg-emerald-500" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentRole.id}
          className="flex items-center gap-1.5"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <currentRole.Icon
            size={20}
            weight="bold"
            className="text-[var(--accent-primary)]"
          />
          <span className="text-sm font-black uppercase tracking-wide text-white md:text-base">
            {currentRole.label}
          </span>
        </motion.div>
      </AnimatePresence>

      {currentTeamName && (
        <span className="text-xs text-white/40">
          {currentTeamName}&rsquo;s turn
        </span>
      )}

      {audienceCount !== undefined && audienceCount > 0 && (
        <span className="text-[10px] text-white/30">
          {audienceCount} watching
        </span>
      )}
    </div>
  );
}
