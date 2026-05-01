import React from "react";
import { motion } from "framer-motion";
import { TASK_TABS } from "../myTasks.utils";

const MyTasksTabs = ({ activeTab, counts, onChange }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex min-w-full items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-1">
        {TASK_TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="myTasksActiveTab"
                  className="absolute inset-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              ) : null}

              <span className="relative whitespace-nowrap">{tab.label}</span>
              <span
                className={`relative rounded-full px-2 py-0.5 text-[11px] ${
                  isActive
                    ? "bg-[var(--bg-soft)] text-[var(--accent)]"
                    : "bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                {counts[tab.key] || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MyTasksTabs;
