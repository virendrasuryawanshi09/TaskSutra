import React from "react";
import { HiOutlineAdjustmentsHorizontal, HiOutlineArrowPath } from "react-icons/hi2";
import MyTasksTabs from "./MyTasksTabs";

const MyTasksToolbar = ({
  activeTab,
  counts,
  resultCount,
  loading,
  onTabChange,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            My Tasks
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {loading ? "Loading tasks..." : `${resultCount} tasks in this view`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text)] transition-all duration-200 hover:bg-[var(--bg-soft)]"
          >
            <HiOutlineAdjustmentsHorizontal className="text-base text-[var(--text-muted)]" />
            Filter
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
            aria-label="Refresh tasks"
          >
            <HiOutlineArrowPath className="text-base" />
          </button>
        </div>
      </div>

      <MyTasksTabs activeTab={activeTab} counts={counts} onChange={onTabChange} />
    </div>
  );
};

export default MyTasksToolbar;
