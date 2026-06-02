import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const Modal = ({ children, isOpen, onClose, title, size = "md" }) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl"
  }[size] || "max-w-lg";

  const bodyHeightClasses = {
    sm: "max-h-[350px]",
    md: "max-h-[400px]",
    lg: "max-h-[520px]",
    xl: "max-h-[650px]"
  }[size] || "max-h-[400px]";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`relative z-10 w-full ${sizeClasses} bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden`}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text)] tracking-tight">
                {title}
              </h3>

              <button
                onClick={onClose}
                aria-label="Close modal"
                className="
                  p-1.5 rounded-md
                  text-[var(--text-muted)]
                  hover:text-[var(--text)]
                  hover:bg-[var(--bg-soft)]
                  transition
                  cursor-pointer
                "
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M1 1l12 12M13 1L1 13"
                  />
                </svg>
              </button>
            </div>

            {/* BODY */}
            <div className={`p-5 ${bodyHeightClasses} overflow-y-auto`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;