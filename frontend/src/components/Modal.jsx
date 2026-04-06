import React from "react";

const Modal = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className="
          absolute inset-0
          bg-black/40 backdrop-blur-sm
          transition-opacity duration-300
        "
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        className="
          relative z-10
          w-full max-w-lg
          bg-[var(--surface)]
          border border-[var(--border)]
          rounded-2xl
          shadow-xl

          animate-[fadeIn_0.2s_ease]
        "
      >

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)] tracking-tight">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="
              p-1.5 rounded-md
              text-[var(--text-muted)]
              hover:text-[var(--text)]
              hover:bg-[var(--bg-soft)]
              transition
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
        <div className="p-5 max-h-[400px] overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;