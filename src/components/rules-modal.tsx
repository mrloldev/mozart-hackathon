"use client";

import { Modal, Button } from "@/components/ui";

export default function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      onClose={onClose}
      title="How to Play"
      maxWidth="md"
      footer={
        <Button fullWidth variant="secondary" onClick={onClose} className="!bg-[var(--foreground)] !text-[var(--background)] hover:!bg-[var(--foreground)]/90">
          Got it
        </Button>
      }
    >
      <div className="max-h-[55vh] overflow-y-auto p-5">
        <div className="space-y-5">
          {[
            {
              step: 1,
              title: "Form Teams",
              desc: "Two teams of three. Each player picks a role: Beat, Melody, or Vocals.",
            },
            {
              step: 2,
              title: "Record",
              desc: "Teams alternate. Beat makers go first, then melody, then vocals. 30 seconds each.",
            },
            {
              step: 3,
              title: "Vote",
              desc: "Listen to both tracks and vote for the winner. Best track wins.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                <span className="text-xs font-bold">{step}</span>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-bold text-[var(--foreground)]">{title}</h3>
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
