"use client";

import { ChevronRight, Pencil } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLES } from "@/constants/game";
import { randomAvatar } from "@/lib/avataaars";
import type { Role } from "@/types/game";
import EditableName from "./editable-name";
import { Button, Input } from "@/components/ui";

type SetupPlayer = { name: string; avatarUrl: string; role: Role };

export default function CreateTeamView({
  teamName,
  setTeamName,
  players,
  setPlayers,
  onBack,
  onSubmit,
  submitLabel,
  joinCode,
  isPublic,
  setIsPublic,
  hideBackInStep1,
}: {
  teamName: string;
  setTeamName: (v: string) => void;
  players: SetupPlayer[];
  setPlayers: React.Dispatch<React.SetStateAction<SetupPlayer[]>>;
  onBack: () => void;
  onSubmit: () => void;
  submitLabel: string;
  joinCode?: string;
  isPublic?: boolean;
  setIsPublic?: (v: boolean) => void;
  hideBackInStep1?: boolean;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  const updatePlayerName = (index: number, name: string) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, name } : p))
    );
  };

  const regenerateAvatar = (index: number) => {
    const seed = Math.random().toString(36).slice(2);
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, avatarUrl: randomAvatar(`${seed}-${index}`) } : p
      )
    );
  };

  const handleMainAction = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onBack();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {step === 2 ? (
        <motion.div
          key="step2"
          className="mx-auto max-w-md space-y-6 px-4 py-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>

          <div>
            <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
              Your Lineup
            </h2>
            <p className="mt-1 text-sm text-white/35">Tap any name to change it</p>
          </div>

          <div className="space-y-2">
            {players.map((player, index) => {
              const role = ROLES.find((r) => r.id === player.role);
              return (
                <motion.div
                  key={index}
                  className="flex items-center gap-4 rounded-xl bg-white/4 p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/6">
                    <Image src={player.avatarUrl} alt={player.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <EditableName
                      value={player.name}
                      onChange={(name) => updatePlayerName(index, name)}
                      className="font-bold text-white inline-flex items-center gap-2"
                      placeholder="Add name"
                      suffix={<Pencil size={12} strokeWidth={2.5} className="text-white/25 shrink-0" />}
                    />
                    <p className="flex items-center gap-1.5 text-xs text-white/35 mt-0.5">
                      {role && <role.Icon size={12} strokeWidth={2.5} className="text-cyan-400" />}
                      <span>{role?.label}</span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {joinCode && (
            <motion.div
              className="rounded-xl bg-white/4 p-4 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <p className="text-xs font-medium text-white/30">Joining room</p>
              <p className="font-display text-2xl font-black tracking-widest text-cyan-400">{joinCode}</p>
            </motion.div>
          )}

          <Button onClick={handleMainAction} size="xl" rightIcon={<ChevronRight size={24} strokeWidth={2.5} />} fullWidth>
            {submitLabel}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="step1"
          className="mx-auto max-w-md space-y-6 px-4 py-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {!hideBackInStep1 && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              ← Back
            </Button>
          )}

          <div>
            <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
              Setup Your Team
            </h2>
            <p className="mt-1 text-sm text-white/35">Tap each field to edit</p>
          </div>

          <Input
            label="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
          />

          {!joinCode && setIsPublic !== undefined && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/4 p-4 transition-colors hover:bg-white/6">
              <input
                type="checkbox"
                checked={isPublic ?? false}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-5 w-5 accent-cyan-400"
              />
              <span className="text-sm font-bold text-white/50">Public game (audience can watch & vote)</span>
            </label>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white/40">Players</label>
              <span className="text-[10px] text-white/20">Tap name or avatar to edit</span>
            </div>
            {players.map((player, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-dashed border-white/8 bg-white/3 p-3 transition-colors focus-within:border-cyan-400/30 focus-within:border-solid focus-within:bg-white/5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <button
                  type="button"
                  onClick={() => regenerateAvatar(index)}
                  className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-white/10 transition-all hover:border-cyan-400/30 hover:border-solid active:scale-95"
                  title="Tap to change avatar"
                >
                  <Image src={player.avatarUrl} alt={player.name} fill className="object-cover" unoptimized />
                </button>
                <div className="flex flex-1 min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 border border-dashed border-white/8 focus-within:border-cyan-400/30 focus-within:border-solid focus-within:bg-white/4">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayerName(index, e.target.value)}
                    className="w-full min-w-0 bg-transparent font-bold text-white outline-none placeholder:text-white/20"
                    placeholder="Enter name"
                  />
                  <Pencil size={12} strokeWidth={2.5} className="shrink-0 text-white/20" aria-hidden />
                </div>
              </motion.div>
            ))}
          </div>

          <Button onClick={handleMainAction} size="xl" rightIcon={<ChevronRight size={24} strokeWidth={2.5} />} fullWidth>
            Continue
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
