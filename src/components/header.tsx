import Link from "next/link";
import Image from "next/image";

export default function Header({
  minimal = false,
  rightSlot,
}: {
  minimal?: boolean;
  rightSlot?: React.ReactNode;
}) {
  if (minimal) {
    return (
      <header className="shrink-0 border-b border-white/5 px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="shrink-0 transition-opacity hover:opacity-80 active:scale-95">
            <Image src="/logo.svg" alt="Arkano" width={56} height={46} priority />
          </Link>
          {rightSlot && <div className="min-w-0 flex-1 flex justify-center">{rightSlot}</div>}
          {!rightSlot && <div />}
        </div>
      </header>
    );
  }

  return (
    <header className="px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="transition-opacity hover:opacity-80 active:scale-95">
          <Image src="/logo.svg" alt="Arkano" width={80} height={66} priority />
        </Link>

        <div className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Live</span>
        </div>
      </div>
    </header>
  );
}
