"use client";

const variants = {
  default: "bg-white/10 text-white/70 border border-white/15",
  primary: "bg-cyan-500/15 text-cyan-300 border border-cyan-400/25 shadow-[0_0_8px_rgba(34,211,238,0.15)]",
  secondary: "bg-orange-500/15 text-orange-300 border border-orange-400/25 shadow-[0_0_8px_rgba(251,146,60,0.15)]",
  success: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 shadow-[0_0_8px_rgba(52,211,153,0.15)]",
  warning: "bg-amber-500/15 text-amber-300 border border-amber-400/25 shadow-[0_0_8px_rgba(251,191,36,0.15)]",
  live: "bg-red-500/15 text-red-400 border border-red-400/25 shadow-[0_0_8px_rgba(248,113,113,0.2)]",
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
