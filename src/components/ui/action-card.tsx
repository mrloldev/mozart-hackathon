"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

const cardClasses = `
  group flex w-full items-center justify-between
  rounded-2xl border-2 border-white/8
  bg-gradient-to-r from-white/5 to-transparent
  px-5 py-5 text-left transition-all duration-200
  hover:border-cyan-400/30 hover:bg-cyan-400/5
  hover:shadow-[0_0_24px_rgba(34,211,238,0.08)]
  active:scale-[0.98]
  disabled:opacity-40 disabled:hover:border-white/8 disabled:hover:bg-transparent disabled:hover:shadow-none
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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500/15">
          {icon}
        </div>
        <div>
          <p className="text-base font-black uppercase tracking-wide text-white">{title}</p>
          <p className="text-sm text-white/40">{description}</p>
        </div>
      </div>
      <ChevronRight
        size={18}
        className="text-white/20 transition-all group-hover:translate-x-1 group-hover:text-cyan-400"
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
