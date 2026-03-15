import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="font-display text-xl font-extrabold tracking-widest transition-opacity hover:opacity-80">
          <span className="text-[var(--accent-primary)]">ARKANO</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse-dot" />
          <span className="text-xs font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}
