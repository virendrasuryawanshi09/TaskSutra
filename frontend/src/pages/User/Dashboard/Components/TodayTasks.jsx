import React from "react";

const PRIORITY_STYLES = {
  High: "text-[#B2554A]",
  Medium: "text-[#C28B2C]",
  Low: "text-[#4C7F6A]",
};

const PRIORITY_ORDER = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const normalizeStatus = (status) => {
  const normalizedValue = String(status || "").trim().toLowerCase();

  if (normalizedValue === "completed") return "Completed";
  if (["in progress", "in-progress", "inprogress"].includes(normalizedValue)) {
    return "In Progress";
  }

  return "Pending";
};

const getValidDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDueDate = (value) => {
  const date = getValidDate(value);

  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const TodayTasks = ({ tasks = [] }) => {
  const now = new Date();

  const priorityTasks = tasks
    .filter((task) => normalizeStatus(task?.status) !== "Completed")
    .slice()
    .sort((leftTask, rightTask) => {
      const leftPriority = PRIORITY_ORDER[leftTask?.priority] ?? 99;
      const rightPriority = PRIORITY_ORDER[rightTask?.priority] ?? 99;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      const leftDueDate = getValidDate(leftTask?.dueDate);
      const rightDueDate = getValidDate(rightTask?.dueDate);

      if (!leftDueDate && !rightDueDate) return 0;
      if (!leftDueDate) return 1;
      if (!rightDueDate) return -1;

      return leftDueDate - rightDueDate;
    })
    .slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">Priority Tasks</h2>
        <span className="text-xs text-[var(--text-muted)]">{priorityTasks.length} tasks</span>
      </div>

      {priorityTasks.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          No priority tasks right now.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {priorityTasks.map((task) => {
            const dueDate = getValidDate(task.dueDate);
            const isOverdue = dueDate && dueDate.getTime() < now.getTime();

            return (
              <li
                key={task._id || task.id || task.title}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-medium ${
                      isOverdue ? "text-[#B2554A]" : "text-[var(--text)]"
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className={`mt-1 text-xs ${isOverdue ? "text-[#B2554A]" : "text-[var(--text-muted)]"}`}>
                    {isOverdue ? "Overdue" : "Due"} {formatDueDate(task.dueDate)}
                  </p>
                </div>

                <span
                  className={`shrink-0 text-xs font-medium ${
                    PRIORITY_STYLES[task.priority] || "text-[var(--text-muted)]"
                  }`}
                >
                  {task.priority || "No Priority"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TodayTasks;
