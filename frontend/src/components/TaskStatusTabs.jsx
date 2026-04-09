import React from "react";

const TaskStatusTabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-6 sm:gap-8 border-b border-[var(--border)] min-w-max">

        {tabs.map((tab) => {
          const isActive = activeTab === tab.label;

          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className="
                relative
                pb-3 text-sm font-medium
                transition-all duration-200
                whitespace-nowrap
              "
            >

              {/* LABEL */}
              <span
                className={`
                  ${
                    isActive
                      ? "text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }
                `}
              >
                {tab.label}
              </span>

              {/* COUNT */}
              <span
                className={`
                  ml-2 text-xs
                  ${
                    isActive
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)]"
                  }
                `}
              >
                {tab.count}
              </span>

              
              <div
                className={`
                  absolute left-0 bottom-0 h-[2px] rounded-full
                  bg-[var(--accent)]
                  transition-all duration-300

                  ${isActive ? "w-full opacity-100" : "w-0 opacity-0"}
                `}
              />

            </button>
          );
        })}

      </div>
    </div>
  );
};

export default TaskStatusTabs;