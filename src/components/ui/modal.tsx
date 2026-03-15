"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  closeOnBackdrop?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
  closeOnBackdrop = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={closeOnBackdrop ? onClose : undefined}
      >
        <motion.div
          className={`w-full ${maxWidthClasses[maxWidth]} rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#111114] shadow-[0_0_60px_rgba(0,0,0,0.6)]`}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display text-base font-black uppercase tracking-wider text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/6 text-white/50 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && (
            <div className="border-t border-white/6 p-4">{footer}</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
