import Link from "next/link";

export default function Footer() {
  return (
    <footer className="px-4 py-4 text-center">
      <Link
        href="/admin"
        className="text-[10px] font-medium text-white/20 transition-colors hover:text-white/40"
      >
        Admin
      </Link>
    </footer>
  );
}
