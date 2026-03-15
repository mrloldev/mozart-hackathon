"use client";

import { Music, Mic, Trophy } from "lucide-react";
import { Modal, Button } from "@/components/ui";

const steps = [
  {
    step: 1,
    title: "Form Teams",
    desc: "Two teams of three. Each player picks a role: Beat, Melody, or Vocals.",
    icon: <Music size={18} />,
    color: "bg-cyan-500/15 text-cyan-400",
  },
  {
    step: 2,
    title: "Record",
    desc: "Teams alternate. Beat makers go first, then melody, then vocals. 30 seconds each.",
    icon: <Mic size={18} />,
    color: "bg-orange-500/15 text-orange-400",
  },
  {
    step: 3,
    title: "Vote & Win",
    desc: "Listen to both tracks and vote for the winner. Best track wins the battle.",
    icon: <Trophy size={18} />,
    color: "bg-emerald-500/15 text-emerald-400",
  },
];

export default function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      onClose={onClose}
      title="How to Play"
      maxWidth="md"
      footer={
        <Button fullWidth variant="secondary" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <div className="p-5">
        <div className="space-y-4">
          {steps.map(({ step, title, desc, icon, color }) => (
            <div key={step} className="flex gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                {icon}
              </div>
              <div className="pt-0.5">
                <h3 className="text-sm font-black uppercase tracking-wide text-white">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/40">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
