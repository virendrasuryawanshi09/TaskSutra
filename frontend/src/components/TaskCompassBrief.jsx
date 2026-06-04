import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineXMark, HiOutlineCheck } from "react-icons/hi2";

const TaskCompassBrief = ({ isOpen, onClose, brief, taskTitle, onStart, taskStatus }) => {
  const [completedItems, setCompletedItems] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!brief) return null;

  // Simple, secure parser to render markdown bolding (**text**) matching the active theme text color
  const formatBriefText = (text) => {
    if (!text) return "";
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-extrabold text-[var(--text)] border-b border-[var(--border)] pb-0.5">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  const handleToggleExpectation = (index) => {
    setCompletedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Center fade-scale variants on PC, slide-up variants on Mobile
  const drawerVariants = {
    hidden: {
      scale: isMobile ? 1 : 0.96,
      y: isMobile ? "100%" : 12,
      opacity: 0,
    },
    visible: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 28, stiffness: 280 },
    },
    exit: {
      scale: isMobile ? 1 : 0.96,
      y: isMobile ? "100%" : 12,
      opacity: 0,
      transition: { duration: 0.18 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm dark:bg-black/55"
          />

          {/* Frosted Glass Container (Respects current theme background/borders) */}
          <motion.aside
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-[110] flex flex-col 
              bg-[var(--surface)]/90 border-[var(--border)] text-[var(--text)] shadow-2xl backdrop-blur-xl
              ${
                isMobile
                  ? "inset-x-0 bottom-0 h-[85vh] rounded-t-3xl border-t"
                  : "inset-0 m-auto w-[95vw] max-w-[600px] h-[75vh] rounded-2xl border"
              }
            `}
          >
            {/* Extremely subtle theme-integrated backlight glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-inherit pointer-events-none">
              <div className="absolute -left-20 -top-20 h-44 w-44 rounded-full bg-[var(--accent)]/10 blur-[50px]" />
              <div className="absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-[var(--accent)]/10 blur-[50px]" />
            </div>

            {/* Header section */}
            <div className="flex-none px-6 py-5 border-b border-[var(--border)]/60 relative">
              {isMobile && (
                <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mb-4" />
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                    Task Compass
                  </span>
                  <h2 className="mt-1 text-base font-bold text-[var(--text)] truncate pr-2">
                    {taskTitle || "AI Briefing"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)] transition-all cursor-pointer"
                >
                  <HiOutlineXMark className="text-base" />
                </button>
              </div>
            </div>

            {/* Scrollable Contents */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Mission Statement */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  The Mission
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text)]/90 whitespace-pre-wrap">
                  {formatBriefText(brief.simplifiedExplanation)}
                </p>
              </div>

              {/* Business Value */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Why It Matters
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text)]/90 whitespace-pre-wrap">
                  {formatBriefText(brief.businessGoal)}
                </p>
              </div>

              {/* What the Receiver Wants */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  What the Receiver Wants
                </h3>
                <div className="space-y-2">
                  {(brief.receiverExpectations || []).map((expectation, idx) => {
                    const isChecked = completedItems[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleExpectation(idx)}
                        className="flex w-full items-start gap-3 text-left bg-[var(--bg-soft)]/20 border border-[var(--border)]/40 p-3 rounded-xl hover:bg-[var(--bg-soft)]/45 transition-all cursor-pointer"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] transition-all ${
                            isChecked
                              ? "border-[#4C7F6A] bg-[rgba(76,127,106,0.14)] text-[#4C7F6A]"
                              : "border-[var(--border)] text-transparent"
                          }`}
                        >
                          <HiOutlineCheck />
                        </span>
                        <span
                          className={`text-sm leading-relaxed transition-all ${
                            isChecked ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]/90"
                          }`}
                        >
                          {formatBriefText(expectation)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimates metadata */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[var(--bg-soft)]/20 border border-[var(--border)]/40 rounded-xl px-4 py-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
                    Difficulty
                  </span>
                  <span
                    className={`mt-1.5 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      brief.difficulty === "Advanced"
                        ? "bg-[rgba(178,85,74,0.14)] text-[#B2554A]"
                        : brief.difficulty === "Intermediate"
                        ? "bg-[rgba(194,139,44,0.14)] text-[#C28B2C]"
                        : "bg-[rgba(76,127,106,0.14)] text-[#4C7F6A]"
                    }`}
                  >
                    {brief.difficulty || "Intermediate"}
                  </span>
                </div>

                <div className="bg-[var(--bg-soft)]/20 border border-[var(--border)]/40 rounded-xl px-4 py-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
                    Estimated Time
                  </span>
                  <span className="mt-1.5 block text-xs font-bold text-[var(--text)]">
                    {formatBriefText(brief.estimatedHours || "4-6 hours")}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex-none px-6 py-5 border-t border-[var(--border)]/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-soft)] text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                Done
              </button>

              {taskStatus !== "In Progress" && taskStatus !== "Completed" && (
                <button
                  type="button"
                  onClick={onStart}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[#4C7F6A] hover:from-[var(--accent-hover)] hover:to-[#3e6857] text-white text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  Start Task
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskCompassBrief;
