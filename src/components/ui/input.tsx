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
          <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-[var(--radius-md)] border bg-[var(--surface)]
            px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]
            outline-none transition-colors duration-200
            border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
