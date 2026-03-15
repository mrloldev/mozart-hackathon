"use client";

import { Modal, Input, Button } from "@/components/ui";

export default function JoinRoomModal({
  code,
  setCode,
  onClose,
  onNext,
}: {
  code: string;
  setCode: (v: string) => void;
  onClose: () => void;
  onNext: () => void;
}) {
  return (
    <Modal
      onClose={onClose}
      title="Join Room"
      maxWidth="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={onNext}
            disabled={code.length < 6}
          >
            Continue
          </Button>
        </div>
      }
    >
      <div className="p-5">
        <Input
          label="Room Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          className="text-center text-2xl font-extrabold tracking-[0.25em] placeholder:text-[var(--muted-foreground)]"
        />
      </div>
    </Modal>
  );
}
