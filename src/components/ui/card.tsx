"use client";

const variants = {
  default: "bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm",
  elevated: "bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.10] shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md",
  ghost: "bg-transparent",
  filled: "bg-white/[0.06]",
  team0: "bg-gradient-to-b from-cyan-950/50 to-cyan-950/10 border border-cyan-400/15 shadow-[0_0_20px_rgba(34,211,238,0.06)]",
  team1: "bg-gradient-to-b from-orange-950/50 to-orange-950/10 border border-orange-400/15 shadow-[0_0_20px_rgba(251,146,60,0.06)]",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
}

export function Card({
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-xl)] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-b border-white/[0.08] px-5 py-4 ${className}`}
      {...props}
    />
  );
}

export function CardBody({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-5 ${className}`} {...props} />;
}

export function CardFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-t border-white/[0.08] p-4 ${className}`}
      {...props}
    />
  );
}
