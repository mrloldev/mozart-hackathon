"use client";

import Header from "./header";
import Footer from "./footer";

export default function AppShell({
  children,
  showFooter = false,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-transparent font-sans">
      <Header />
      {children}
      {showFooter && <Footer />}
    </div>
  );
}
