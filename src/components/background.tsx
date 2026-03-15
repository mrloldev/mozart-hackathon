"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Background() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--background)]">
      <motion.div
        className="absolute -top-[40%] -left-[30%] h-[90%] w-[80%] rounded-full bg-cyan-500/[0.08] blur-[180px]"
        animate={{
          x: [0, 100, 30, 0],
          y: [0, 60, -30, 0],
          scale: [1, 1.2, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[10%] -right-[30%] h-[80%] w-[70%] rounded-full bg-orange-500/[0.06] blur-[180px]"
        animate={{
          x: [0, -80, -20, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 1.05, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      <motion.div
        className="absolute -bottom-[30%] left-[5%] h-[75%] w-[80%] rounded-full bg-purple-600/[0.06] blur-[180px]"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -80, -20, 0],
          scale: [1, 1.1, 1.2, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 8 }}
      />
      <motion.div
        className="absolute top-[30%] left-[40%] h-[40%] w-[40%] rounded-full bg-cyan-400/[0.04] blur-[140px]"
        animate={{
          x: [0, -50, 50, 0],
          y: [0, 40, -40, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
