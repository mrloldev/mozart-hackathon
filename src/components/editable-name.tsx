"use client";

import { useState } from "react";

export default function EditableName({
  value,
  onChange,
  className,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  suffix?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    setDraft(value);
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  return editing ? (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && save()}
      autoFocus
      className={`w-full rounded border border-[var(--accent-primary)]/50 bg-[var(--surface)] px-2 py-1 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 ${className ?? ""}`}
      placeholder={placeholder}
    />
  ) : (
    <button
      type="button"
      onClick={startEdit}
      className={`flex w-fit items-center gap-2 hover:opacity-90 ${className ?? ""}`}
      title="Tap to edit"
    >
      <span className="truncate">{value || placeholder}</span>
      {suffix}
    </button>
  );
}
