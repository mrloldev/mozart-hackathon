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
        className="absolute -top-[30%] -left-[20%] h-[80%] w-[70%] rounded-full bg-cyan-500/[0.07] blur-[160px]"
        animate={{
          x: [0, 80, 20, 0],
          y: [0, 50, -20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[15%] -right-[25%] h-[70%] w-[60%] rounded-full bg-orange-500/[0.05] blur-[160px]"
        animate={{
          x: [0, -60, -10, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.1, 1.05, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
      <motion.div
        className="absolute -bottom-[20%] left-[10%] h-[60%] w-[70%] rounded-full bg-purple-600/[0.04] blur-[160px]"
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -60, -10, 0],
          scale: [1, 1.1, 1.15, 1],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 10 }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,7,0.4)_70%,rgba(5,5,7,0.8)_100%)]" />
    </div>
  );
}
