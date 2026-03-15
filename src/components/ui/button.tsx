"use client";

import { forwardRef } from "react";

const variants = {
  primary: "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]",
  secondary: "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]",
  ghost: "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
  outline: "border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10",
  team0: "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]",
  team1: "bg-[var(--accent-secondary)] text-white hover:bg-[var(--accent-secondary-hover)]",
};

const sizes = {
  sm: "min-h-[44px] px-3 py-1.5 text-sm",
  md: "min-h-[44px] px-4 py-2.5 text-sm",
  lg: "min-h-[44px] px-6 py-3 text-base",
  xl: "min-h-[48px] px-6 py-4 text-base sm:px-10 sm:text-lg",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-2 font-semibold
          rounded-[var(--radius-md)] transition-all duration-200 ease-out
          active:scale-[0.98]
          disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
