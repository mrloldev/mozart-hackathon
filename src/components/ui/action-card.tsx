"use client";

import { CaretRight } from "@phosphor-icons/react";
import Link from "next/link";

const cardClasses = `
  group flex w-full min-h-[56px] items-center justify-between rounded-[var(--radius-lg)]
  border border-[var(--border)] bg-[var(--surface)]
  px-4 py-4 text-left transition-all duration-200 sm:px-5
  hover:border-[var(--accent-primary)]/50 hover:bg-[var(--accent-primary)]/5
  disabled:opacity-50 disabled:hover:border-[var(--border)] disabled:hover:bg-[var(--surface)]
`;

export interface ActionCardProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement> & React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  href?: string;
}

export function ActionCard({
  icon,
  title,
  description,
  disabled,
  href,
  className = "",
  onClick,
  ...props
}: ActionCardProps) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <span className="text-[var(--accent-primary)]">{icon}</span>
        <div>
          <p className="font-semibold text-[var(--foreground)]">{title}</p>
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        </div>
      </div>
      <CaretRight
        size={16}
        weight="bold"
        className="text-[var(--muted-foreground)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--accent-primary)]"
      />
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={`${cardClasses} ${className}`}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onClick}
      className={`${cardClasses} ${className}`}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
