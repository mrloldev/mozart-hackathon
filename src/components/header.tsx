import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Image src="/logo.svg" alt="Arkano" width={90} height={75} priority />
        </Link>

        <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse-dot" />
          <span className="text-xs font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}
