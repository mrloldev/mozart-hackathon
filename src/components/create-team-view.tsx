"use client";

import { CaretRight, PencilSimple } from "@phosphor-icons/react";
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
          className="mx-auto max-w-lg space-y-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>

          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-wider text-[var(--foreground)]">
              Your Lineup
            </h2>
            <p className="mt-1 text-[var(--muted-foreground)]">
              Tap any name to change it
            </p>
          </div>

          <div className="space-y-3">
            {players.map((player, index) => {
              const role = ROLES.find((r) => r.id === player.role);
              return (
                <motion.div
                  key={index}
                  className="flex items-center gap-4 rounded-[var(--radius-md)] bg-[var(--surface)] p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={player.avatarUrl}
                      alt={player.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <EditableName
                      value={player.name}
                      onChange={(name) => updatePlayerName(index, name)}
                      className="font-semibold text-[var(--foreground)] inline-flex items-center gap-2 rounded px-2 py-1 -mx-2 -my-1 border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
                      placeholder="Add name"
                      suffix={<PencilSimple size={14} weight="bold" className="text-[var(--muted-foreground)] shrink-0" />}
                    />
                    <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mt-1">
                      {role && <role.Icon size={16} weight="bold" className="text-[var(--accent-primary)]" />}
                      <span>{role?.label}</span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {joinCode && (
            <motion.div 
              className="rounded-[var(--radius-md)] bg-[var(--surface)] p-4 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-[var(--muted-foreground)]">Joining room</p>
              <p className="font-display text-2xl font-black tracking-widest text-[var(--accent-primary)]">{joinCode}</p>
            </motion.div>
          )}

          <Button onClick={handleMainAction} size="xl" rightIcon={<CaretRight size={24} weight="bold" />} fullWidth>
            {submitLabel}
          </Button>
        </motion.div>
      ) : (
        <motion.div 
          key="step1"
          className="mx-auto max-w-lg space-y-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>

          <div>
            <h2 className="font-display text-2xl font-black uppercase tracking-wider text-[var(--foreground)]">
              Setup Your Team
            </h2>
            <p className="mt-1 text-[var(--muted-foreground)]">
              Tap each field to edit
            </p>
          </div>

          <Input
            label="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
          />

          {!joinCode && setIsPublic !== undefined && (
            <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-hover)]">
              <input
                type="checkbox"
                checked={isPublic ?? false}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-5 w-5 accent-[var(--accent-primary)]"
              />
              <span className="text-sm font-semibold text-[var(--muted)]">Public game (audience can watch and vote)</span>
            </label>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-[var(--muted)]">
                Players
              </label>
              <span className="text-xs text-[var(--muted-foreground)]">Tap name or avatar to edit</span>
            </div>
            {players.map((player, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-3 transition-colors focus-within:border-[var(--accent-primary)] focus-within:border-solid focus-within:bg-[var(--surface-hover)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  type="button"
                  onClick={() => regenerateAvatar(index)}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-[var(--border)] transition-all hover:border-[var(--accent-primary)] hover:border-solid"
                  title="Tap to change avatar"
                >
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
                <div className="flex flex-1 min-w-0 items-center gap-2 rounded px-2 py-1.5 border border-dashed border-[var(--border)] focus-within:border-[var(--accent-primary)] focus-within:border-solid focus-within:bg-[var(--surface-hover)]">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayerName(index, e.target.value)}
                    className="w-full min-w-0 bg-transparent font-semibold text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                    placeholder="Enter name"
                  />
                  <PencilSimple size={14} weight="bold" className="shrink-0 text-[var(--muted-foreground)]" aria-hidden />
                </div>
              </motion.div>
            ))}
          </div>

          <Button onClick={handleMainAction} size="xl" rightIcon={<CaretRight size={24} weight="bold" />} fullWidth>
            Continue
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
