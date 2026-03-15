"use client";

import { forwardRef } from "react";

const variants = {
  primary: `
    bg-gradient-to-b from-cyan-400 to-cyan-600 text-white font-black
    shadow-[0_0_20px_rgba(34,211,238,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]
    hover:shadow-[0_0_32px_rgba(34,211,238,0.4)] hover:from-cyan-300 hover:to-cyan-500
  `,
  secondary: `
    bg-white/[0.07] text-white/90 border border-white/[0.12]
    hover:bg-white/[0.12] hover:border-white/20
    shadow-[0_2px_8px_rgba(0,0,0,0.3)]
  `,
  ghost: `
    bg-transparent text-white/50
    hover:bg-white/[0.06] hover:text-white/80
  `,
  outline: `
    border-2 border-cyan-400/40 text-cyan-300
    hover:bg-cyan-400/[0.08] hover:border-cyan-400/60
  `,
  team0: `
    bg-gradient-to-b from-cyan-400 to-cyan-600 text-white font-black
    shadow-[0_0_24px_rgba(34,211,238,0.3)]
    hover:shadow-[0_0_36px_rgba(34,211,238,0.45)]
  `,
  team1: `
    bg-gradient-to-b from-orange-400 to-orange-600 text-white font-black
    shadow-[0_0_24px_rgba(251,146,60,0.3)]
    hover:shadow-[0_0_36px_rgba(251,146,60,0.45)]
  `,
  danger: `
    bg-gradient-to-b from-red-500 to-red-700 text-white font-bold
    shadow-[0_0_16px_rgba(239,68,68,0.25)]
  `,
};

const sizes = {
  sm: "min-h-[40px] px-4 py-2 text-xs font-bold tracking-wide",
  md: "min-h-[48px] px-5 py-2.5 text-sm font-bold tracking-wide",
  lg: "min-h-[52px] px-6 py-3 text-base font-black tracking-wide",
  xl: "min-h-[60px] px-8 py-4 text-lg font-black tracking-wider uppercase",
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
          inline-flex items-center justify-center gap-2
          rounded-[var(--radius-lg)]
          transition-all duration-200
          active:scale-[0.96]
          disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        style={{ transitionTimingFunction: "cubic-bezier(.34, 1.56, .64, 1)" }}
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
