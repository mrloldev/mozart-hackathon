"use client";

const variants = {
  default: "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]",
  primary: "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30",
  secondary: "bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/30",
  success: "bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30",
  warning: "bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
