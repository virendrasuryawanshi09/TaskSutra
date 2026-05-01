import React from "react";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import PremiumTaskCard from "./PremiumTaskCard";

const PremiumTaskGrid = ({ tasks, loading, onTaskClick }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[248px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)]"
          />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)]/35 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--accent)]">
          <HiOutlineClipboardDocumentList className="text-2xl" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-[var(--text)]">
          No tasks found
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
          Try a different search or switch to another task view.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {tasks.map((task, index) => (
        <PremiumTaskCard
          key={task.id || `${task.title}-${index}`}
          task={task}
          index={index}
          onClick={onTaskClick}
        />
      ))}
    </div>
  );
};

export default PremiumTaskGrid;
