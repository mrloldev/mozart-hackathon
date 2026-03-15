import Image from "next/image";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--background)] py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-center gap-6 text-xs text-[var(--muted-foreground)]">
        <Image src="/logo.svg" alt="Arkano" width={50} height={42} />
        <span>·</span>
        <a href="#" className="transition-colors hover:text-[var(--foreground)]">Terms</a>
        <a href="#" className="transition-colors hover:text-[var(--foreground)]">Privacy</a>
      </div>
    </footer>
  );
}
