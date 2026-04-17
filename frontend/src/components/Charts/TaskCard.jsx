import React from "react";
import AvatarGroup from "../AvatarGroup";
import { LuPaperclip } from "react-icons/lu";
import moment from "moment";

const TaskCard = ({
  title,
  description,
  priority,
  status,
  progress = 0,
  dueDate,
  assignedTo = [],
  attachmentCount = 0,
  completedTodoCount = 0,
  todoChecklist = [],
  onClick,
}) => {

  const getStatusColor = () => {
    switch (status) {
      case "Completed":
        return "text-green-500";
      case "In Progress":
        return "text-cyan-500";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  const getPriorityGlow = () => {
    switch (priority) {
      case "High":
        return "shadow-[0_0_0_1px_rgba(249,115,22,0.4)]";
      case "Medium":
        return "shadow-[0_0_0_1px_rgba(59,130,246,0.4)]";
      case "Low":
        return "shadow-[0_0_0_1px_rgba(34,197,94,0.4)]";
      default:
        return "";
    }
  };

  const getProgressGradient = () => {
    switch (status) {
      case "Completed":
        return "from-green-400 to-green-600";
      case "In Progress":
        return "from-cyan-400 to-cyan-600";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        group cursor-pointer relative

        bg-[var(--surface)]
        border border-[var(--border)]
        rounded-2xl p-4

        hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]
        hover:-translate-y-[4px]

        transition-all duration-300
        ${getPriorityGlow()}
      `}
    >

      {/* 🔥 HEADER */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {status}
        </span>

        <span className="text-xs text-[var(--text-muted)]">
          {moment(dueDate).format("MMM DD")}
        </span>
      </div>

      {/* 🔥 TITLE */}
      <h3 className="text-sm font-semibold text-[var(--text)] leading-snug">
        {title}
      </h3>

      {/* 🔥 DESCRIPTION */}
      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
        {description}
      </p>

      {/* 🔥 PROGRESS */}
      <div className="mt-4">

        <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
          <span>
            {completedTodoCount} / {todoChecklist?.length || 0}
          </span>
          <span>{progress}%</span>
        </div>

        <div className="h-1.5 bg-[var(--bg-soft)] rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full
              bg-gradient-to-r ${getProgressGradient()}
              transition-all duration-500
            `}
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

      {/* 🔥 FOOTER */}
      <div className="flex items-center justify-between mt-4">

        {/* LEFT */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <LuPaperclip />
              {attachmentCount}
            </div>
          )}
        </div>

        {/* RIGHT (FIXED AVATAR) */}
        <AvatarGroup avatars={assignedTo} />

      </div>

    </div>
  );
};

export default TaskCard;