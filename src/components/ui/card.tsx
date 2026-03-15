"use client";

const variants = {
  default: "bg-[var(--surface)] border border-[var(--border)]",
  elevated: "bg-[var(--surface-elevated)] border border-[var(--border)]",
  ghost: "bg-transparent",
  filled: "bg-[var(--surface)]",
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
      className={`border-b border-[var(--border)] px-5 py-4 ${className}`}
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
      className={`border-t border-[var(--border)] p-4 ${className}`}
      {...props}
    />
  );
}
