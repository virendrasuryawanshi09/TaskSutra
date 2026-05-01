import React from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCalendarDays,
  HiOutlineChevronRight,
  HiOutlinePaperClip,
} from "react-icons/hi2";
import AvatarGroup from "../../../../components/AvatarGroup";
import SelectDropdown from "../../../../components/input/SelectDropdown";
import { formatTaskDate, getDueTone, getTaskTags } from "../myTasks.utils";

const statusOptions = [
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
];

const priorityStyles = {
  Low: "bg-[rgba(76,127,106,0.15)] text-[#4C7F6A]",
  Medium: "bg-[rgba(194,139,44,0.16)] text-[#C28B2C]",
  High: "bg-[rgba(178,85,74,0.15)] text-[#B2554A]",
};

const statusStyles = {
  Pending: "bg-[rgba(194,139,44,0.14)] text-[#C28B2C]",
  "In Progress": "bg-[rgba(47,122,132,0.14)] text-[#2F7A84]",
  Completed: "bg-[rgba(76,127,106,0.14)] text-[#4C7F6A]",
};

const dueToneStyles = {
  completed: "text-[#4C7F6A]",
  overdue: "text-[#B2554A]",
  urgent: "text-[#B2554A]",
  soon: "text-[#C28B2C]",
  neutral: "text-[var(--text-muted)]",
};

const progressTone = {
  Pending: "bg-[#C28B2C]",
  "In Progress": "bg-[var(--accent)]",
  Completed: "bg-[#4C7F6A]",
};

const PremiumTaskCard = ({ task, index, onClick, onStatusChange, updatingTaskId }) => {
  const dueTone = getDueTone(task);
  const tags = getTaskTags(task);
  const isUpdating = updatingTaskId === task.id;

  return (
    <motion.button
      type="button"
      onClick={() => onClick?.(task)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.24, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className="group flex w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-all duration-200 hover:border-[rgba(31,111,120,0.28)] hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="flex flex-wrap items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-[138px]">
              <SelectDropdown
                options={statusOptions}
                value={task.status}
                onChange={(value) => onStatusChange?.(task, value)}
              />
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${priorityStyles[task.priority] || "bg-[var(--bg-soft)] text-[var(--text-muted)]"}`}>
              {task.priority}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-6 text-[var(--text)]">
            {task.title || "Untitled task"}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
            {task.description || "No description added yet."}
          </p>
        </div>

        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] transition-all duration-200 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
          <HiOutlineChevronRight className="text-lg" />
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            {task.completedChecklistCount} of {task.checklistCount || 0} done
          </span>
          <span className="font-medium text-[var(--text)]">{task.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressTone[task.status] || "bg-[var(--text-muted)]"}`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
        {isUpdating ? (
          <p className="text-xs text-[var(--text-muted)]">Updating status...</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
        <div className="flex min-w-0 items-center gap-3 text-xs">
          <span className={`flex items-center gap-1.5 ${dueToneStyles[dueTone]}`}>
            <HiOutlineCalendarDays className="text-base" />
            {formatTaskDate(task.dueDateValue, { year: "numeric" })}
          </span>

          {task.attachmentCount > 0 ? (
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <HiOutlinePaperClip className="text-base" />
              {task.attachmentCount}
            </span>
          ) : null}
        </div>

        <AvatarGroup avatars={task.assignedUsers} />
      </div>
    </motion.button>
  );
};

export default PremiumTaskCard;
