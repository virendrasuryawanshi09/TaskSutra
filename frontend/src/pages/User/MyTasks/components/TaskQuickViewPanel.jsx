import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCalendarDays,
  HiOutlineCheck,
  HiOutlineClipboardDocumentCheck,
  HiOutlineXMark,
} from "react-icons/hi2";
import AvatarGroup from "../../../../components/AvatarGroup";
import { formatTaskDate } from "../myTasks.utils";

const statusStyles = {
  Pending: "bg-[rgba(194,139,44,0.14)] text-[#C28B2C]",
  "In Progress": "bg-[rgba(47,122,132,0.14)] text-[#2F7A84]",
  Completed: "bg-[rgba(76,127,106,0.14)] text-[#4C7F6A]",
};

const TaskQuickViewPanel = ({ task, open, onClose, onOpenTask }) => {
  return (
    <AnimatePresence>
      {open && task ? (
        <>
          <motion.button
            type="button"
            aria-label="Close task preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: -420 }}
            animate={{ x: 0 }}
            exit={{ x: -420 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-[90] flex w-full flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[420px]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-soft)]/35 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]">
                  <HiOutlineClipboardDocumentCheck className="text-xl" />
                </span>
                <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Task Preview
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Assigned work details
                </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
              >
                <HiOutlineXMark className="text-lg" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[task.status] || "bg-[var(--bg-soft)] text-[var(--text-muted)]"}`}>
                  {task.status}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                  {task.priority}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-semibold leading-8 text-[var(--text)]">
                {task.title || "Untitled task"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                {task.description || "No description added yet."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/45 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Due Date
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                    <HiOutlineCalendarDays className="text-base text-[var(--accent)]" />
                    {formatTaskDate(task.dueDateValue, { year: "numeric" })}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/45 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Progress
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text)]">
                    {task.progress}% complete
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--border)] px-4 py-4">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>
                    {task.completedChecklistCount} of {task.checklistCount || 0} completed
                  </span>
                  <AvatarGroup avatars={task.assignedUsers} />
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-7">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Checklist
                </p>
                <div className="mt-3 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
                  {(task.checklist || []).slice(0, 5).map((item, index) => (
                    <div key={`${item.text}-${index}`} className="flex items-start gap-3 px-4 py-3">
                      <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                        item.completed
                          ? "border-[#4C7F6A] bg-[rgba(76,127,106,0.14)] text-[#4C7F6A]"
                          : "border-[var(--border)] text-[var(--text-muted)]"
                      }`}>
                        {item.completed ? <HiOutlineCheck /> : index + 1}
                      </span>
                      <p className={`text-sm leading-6 ${
                        item.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]"
                      }`}>
                        {item.text}
                      </p>
                    </div>
                  ))}

                  {!task.checklist?.length ? (
                    <p className="px-4 py-5 text-sm text-[var(--text-muted)]">
                      No checklist added.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4">
              <button
                type="button"
                onClick={() => onOpenTask?.(task)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.99]"
              >
                Open Full Task
                <HiOutlineArrowTopRightOnSquare className="text-base" />
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default TaskQuickViewPanel;
