"use client";

import { DeviceMobile, Sparkle, Television, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ActionCard, Badge, Button } from "@/components/ui";
import { getRoomSessionForCode } from "@/lib/room-session";

type LiveRoom = { code: string; phase: string; isPublic?: boolean; createdAt: number };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function HomeView({
  songCount = 0,
  liveRooms = [],
  onCreateTeam,
  onJoinRoom,
  onLocalPlay,
  onOpenRules,
}: {
  songCount?: number;
  liveRooms?: LiveRoom[];
  onCreateTeam: () => void;
  onJoinRoom: () => void;
  onLocalPlay: () => void;
  onOpenRules: () => void;
}) {
  const hasSongs = songCount > 0;
  const [sessionHrefs, setSessionHrefs] = useState<Record<string, string>>({});

  useEffect(() => {
    const hrefs: Record<string, string> = {};
    for (const room of liveRooms) {
      const session = getRoomSessionForCode(room.code);
      hrefs[room.code] = session
        ? `/room/${room.code}`
        : room.isPublic
          ? `/watch?code=${room.code}`
          : `/join?code=${room.code}`;
    }
    setSessionHrefs(hrefs);
  }, [liveRooms]);

  return (
    <motion.div 
      className="px-6 py-16 md:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="mx-auto max-w-4xl">
        <motion.div variants={itemVariants} className="mb-10 text-center md:mb-12">
          <p className="font-display mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">
            Multiplayer Music Game
          </p>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-[var(--foreground)] md:text-4xl">
            Create music together.
            <br />
            <span className="text-[var(--muted)]">Compete to win.</span>
          </h2>
          <p className="mt-4 text-sm text-[var(--muted-foreground)] md:hidden">
            Watch a current play or create yours.
          </p>
          <p className="mt-4 hidden text-sm text-[var(--muted-foreground)] md:block">
            Two teams, three players each. Random song. Record beats, melody, vocals.
          </p>
        </motion.div>

        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-center md:gap-12">
          {liveRooms.length > 0 && (
            <motion.div variants={itemVariants} className="flex-1 md:min-w-[280px]">
              <div className="mb-4 flex items-center gap-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Watch current players
                </h3>
                <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-red-500">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  LIVE NOW
                </div>
              </div>
              <div className="space-y-2">
                {liveRooms.map((r, i) => (
                  <motion.div
                    key={r.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                  >
                    <Link
                      href={sessionHrefs[r.code] ?? (r.isPublic ? `/watch?code=${r.code}` : `/join?code=${r.code}`)}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:scale-[1.02] hover:border-[var(--accent-primary)] hover:bg-[var(--surface-hover)] active:scale-[0.98]"
                    >
                      <span className="font-display font-bold tracking-wider text-[var(--foreground)]">
                        {r.code}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge variant="primary">Playing</Badge>
                        {r.isPublic && (
                          <span title="Public - audience can watch">
                            <Television size={16} weight="fill" className="text-[var(--muted-foreground)]" />
                          </span>
                        )}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className={`flex-1 space-y-3 md:min-w-[280px] ${liveRooms.length > 0 ? "" : "md:max-w-md md:mx-auto"}`}>
            {liveRooms.length > 0 && (
              <h3 className="mb-4 hidden font-display text-sm font-bold uppercase tracking-wider text-[var(--foreground)] md:block">
                Or play yourself
              </h3>
            )}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <ActionCard
                icon={<DeviceMobile size={20} weight="bold" />}
                title="Local Play"
                description={hasSongs ? "Both teams · random song" : "Add songs in admin first"}
                onClick={onLocalPlay}
                disabled={!hasSongs}
              />
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <ActionCard
                icon={<Sparkle size={20} weight="bold" />}
                title="Create Room"
                description={hasSongs ? "Host online · random song" : "Add songs in admin first"}
                onClick={onCreateTeam}
                disabled={!hasSongs}
              />
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <ActionCard
                icon={<Users size={20} weight="bold" />}
                title="Join Room"
                description="Enter a 6-letter code"
                onClick={onJoinRoom}
              />
            </motion.div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            fullWidth
            onClick={onOpenRules}
            className="py-4"
          >
            How does it work?
          </Button>
          <Link
            href="/admin"
            className="text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--muted)]"
          >
            Admin
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
