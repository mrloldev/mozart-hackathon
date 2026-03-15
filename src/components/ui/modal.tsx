"use client";

import { X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";

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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeOnBackdrop ? onClose : undefined}
      >
        <motion.div
          className={`w-full ${maxWidthClasses[maxWidth]} rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-modal)] shadow-xl`}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="!p-2"
              aria-label="Close"
            >
              <X size={18} weight="bold" />
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && (
            <div className="border-t border-[var(--border)] p-4">{footer}</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
