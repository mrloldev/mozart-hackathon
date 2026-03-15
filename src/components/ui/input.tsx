"use client";

import { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-[var(--radius-lg)] border bg-white/[0.05]
            px-4 py-3.5 text-white placeholder:text-white/25
            outline-none transition-all duration-200
            border-white/[0.10] focus:border-cyan-400/50 focus:bg-white/[0.07] focus:shadow-[0_0_16px_rgba(34,211,238,0.1)]
            disabled:opacity-40 disabled:cursor-not-allowed
            ${error ? "border-red-400/50 focus:border-red-400/70 focus:shadow-[0_0_16px_rgba(248,113,113,0.1)]" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
