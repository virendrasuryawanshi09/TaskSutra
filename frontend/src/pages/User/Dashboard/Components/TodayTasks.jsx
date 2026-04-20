import React from "react";

const PRIORITY_STYLES = {
  High: "text-[#B2554A]",
  Medium: "text-[#C28B2C]",
  Low: "text-[#4C7F6A]",
};

const isSameDay = (date, compareDate) =>
  date.getFullYear() === compareDate.getFullYear() &&
  date.getMonth() === compareDate.getMonth() &&
  date.getDate() === compareDate.getDate();

const formatDueTime = (value) => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const TodayTasks = ({ tasks = [] }) => {
  const now = new Date();

  const todayTasks = tasks
    .filter((task) => {
      if (!task?.dueDate) {
        return false;
      }

      const dueDate = new Date(task.dueDate);
      return !Number.isNaN(dueDate.getTime()) && isSameDay(dueDate, now);
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text)]">Today Focus</h2>

      {todayTasks.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          No tasks due today.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {todayTasks.map((task) => {
            const dueDate = new Date(task.dueDate);
            const isOverdue =
              !Number.isNaN(dueDate.getTime()) &&
              dueDate.getTime() < now.getTime() &&
              task.status !== "Completed";

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
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Due {formatDueTime(task.dueDate)}
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
