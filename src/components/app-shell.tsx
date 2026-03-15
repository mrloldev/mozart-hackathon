"use client";

import Header from "./header";
import Footer from "./footer";

export default function AppShell({
  children,
  showFooter = false,
  minimal = false,
  headerRight,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
  minimal?: boolean;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-transparent font-sans">
      <Header minimal={minimal} rightSlot={headerRight} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {showFooter && <Footer />}
    </div>
  );
}
