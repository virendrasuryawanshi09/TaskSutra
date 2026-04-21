import React from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const TaskTable = ({ tasks = [] }) => {
  const navigate = useNavigate();

  const normalizeStatus = (status) => {
    const normalizedValue = String(status || "").trim().toLowerCase();

    if (normalizedValue === "completed") return "Completed";
    if (["in progress", "in-progress", "inprogress"].includes(normalizedValue)) {
      return "In Progress";
    }
    return "Pending";
  };

  const getStatusBadge = (status) => {
    switch (normalizeStatus(status)) {
      case "Completed":
        return "border border-[rgba(76,127,106,0.18)] bg-[rgba(76,127,106,0.16)] text-[#4C7F6A] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]";
      case "In Progress":
        return "border border-[rgba(47,122,132,0.18)] bg-[rgba(47,122,132,0.16)] text-[#2F7A84] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]";
      case "Pending":
        return "border border-[rgba(194,139,44,0.18)] bg-[rgba(194,139,44,0.16)] text-[#C28B2C] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]";
      default:
        return "bg-[var(--bg-soft)] text-[var(--text-muted)]";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return "bg-[rgba(178,85,74,0.15)] text-[#B2554A]";
      case "Medium":
        return "bg-[rgba(194,139,44,0.15)] text-[#C28B2C]";
      case "Low":
        return "bg-[rgba(76,127,106,0.15)] text-[#4C7F6A]";
      default:
        return "bg-[var(--bg-soft)] text-[var(--text-muted)]";
    }
  };

  const getStatusDot = (status) => {
    switch (normalizeStatus(status)) {
      case "Completed":
        return "bg-[#4C7F6A]";
      case "In Progress":
        return "bg-[var(--accent)]";
      case "Pending":
        return "bg-[#C28B2C]";
      default:
        return "bg-[var(--text-muted)]";
    }
  };

  const formatDueDate = (task) => {
    const taskDate = task.dueDate || task.deadline;
    return taskDate ? moment(taskDate).format("DD MMM YYYY") : "--";
  };

  const handleView = (taskId) => {
    if (!taskId) {
      toast.error("Task details are unavailable for this item.");
      return;
    }

    navigate(`/user/task-details/${taskId}`);
  };

  const handleAsk = () => {
    toast("Ask feature coming soon.");
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => {
          const taskId = task._id || task.id;

          return (
            <div
              key={taskId || task.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${getStatusDot(task.status)}`}></div>
                    <p className="text-[15px] font-semibold leading-6 text-[var(--text)] break-words">
                      {task.title}
                    </p>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Due {formatDueDate(task)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(task.status)}`}>
                  {normalizeStatus(task.status)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                  {task.priority || "No Priority"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleView(taskId)}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:bg-[var(--bg-soft)]"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={handleAsk}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:bg-[var(--bg-soft)]"
                >
                  Ask
                </button>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] py-12 text-center text-sm text-[var(--text-muted)]">
            No tasks found
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--bg-soft)]">
            <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="w-[30%] px-4 py-4 font-medium">Task Name</th>
              <th className="w-[15%] px-4 py-4 font-medium">Status</th>
              <th className="w-[15%] px-4 py-4 font-medium">Priority</th>
              <th className="w-[18%] px-4 py-4 font-medium">Due Date</th>
              <th className="w-[22%] px-4 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => {
              const taskId = task._id || task.id;

              return (
                <tr
                  key={taskId || task.title}
                  className="border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] hover:bg-[var(--bg-soft)] transition-all duration-200"
                >
                  <td className="px-4 py-4 font-medium text-[var(--text)]">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${getStatusDot(task.status)}`}></div>
                      <span className="truncate">{task.title}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${getStatusBadge(task.status)}`}>
                      {normalizeStatus(task.status)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${getPriorityBadge(task.priority)}`}>
                      {task.priority || "No Priority"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-[var(--text-muted)]">
                    {formatDueDate(task)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(taskId)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:bg-[var(--bg-soft)]"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={handleAsk}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:bg-[var(--bg-soft)]"
                      >
                        Ask
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {tasks.length === 0 && (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">
            No tasks found
          </div>
        )}
      </div>
    </>
  );
};

export default TaskTable;
