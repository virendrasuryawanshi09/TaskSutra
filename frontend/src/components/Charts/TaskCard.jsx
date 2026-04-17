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
  createdAt,
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
        return "text-cyan-400";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  const getPriorityDot = () => {
    switch (priority) {
      case "High":
        return "bg-orange-500";
      case "Medium":
        return "bg-blue-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "In Progress":
        return "bg-cyan-400";
      default:
        return "bg-gray-400";
    }
  };

  const formatDate = (d) =>
    d && moment(d).isValid() ? moment(d).format("MMM DD") : null;

  const created = formatDate(createdAt);
  const due = formatDate(dueDate);

  return (
    <div
      onClick={onClick}
      className="
  group cursor-pointer

  bg-[var(--surface)]
  rounded-xl px-4 py-4

  transition-all duration-200 ease-out

  hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]
  hover:-translate-y-[2px]

  active:scale-[0.99]
"
    >

      {/* 🔥 TOP META */}
      <div className="flex items-center justify-between mb-2 text-xs">

        <div className="flex items-center gap-2">

          <span className={`${getStatusColor()} font-medium`}>
            {status}
          </span>

          <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot()}`} />

        </div>

        <span className="text-[var(--text-muted)]">
          Due : {due || "—"}
        </span>

      </div>

      {/* 🔥 TITLE */}
      <h3 className="
        text-[15px] font-medium text-[var(--text)]
        leading-snug tracking-tight
      ">
        {title}
      </h3>

      {/* 🔥 DESCRIPTION */}
      <p className="
        text-[13px] text-[var(--text-muted)]
        mt-1 line-clamp-2
      ">
        {description}
      </p>

      {/* 🔥 PROGRESS */}
      <div className="mt-3">

        <div className="h-[3px] bg-[var(--bg-soft)] rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

      {/* 🔥 FOOTER */}
      <div className="flex items-center justify-between mt-3 text-[12px] text-[var(--text-muted)]">

        <div className="flex items-center gap-3">

          {attachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <LuPaperclip />
              {attachmentCount}
            </div>
          )}

          {created && (
            <span className="hidden sm:inline">
              {created}
            </span>
          )}

        </div>

        <AvatarGroup avatars={assignedTo} />

      </div>

    </div>
  );
};

export default TaskCard;