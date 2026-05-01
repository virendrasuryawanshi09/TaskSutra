import React from "react";
import { motion } from "framer-motion";
import { TASK_TABS } from "../myTasks.utils";

const MyTasksTabs = ({ activeTab, counts, onChange }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-6 border-b border-[var(--border)]">
        {TASK_TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative flex min-h-11 items-center gap-2 pb-3 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="myTasksActiveTab"
                  className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[var(--accent)]"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              ) : null}

              <span className="relative whitespace-nowrap">{tab.label}</span>
              <span
                className={`relative rounded-full px-2 py-0.5 text-[11px] ${
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "bg-[var(--bg-soft)] text-[var(--text-muted)]"
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
