import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import TodayTasks from "./Components/TodayTasks";
import TaskTable from "./Components/TaskTable";
import InfoCard from "../../../components/Cards/InfoCard";
import {
  HiOutlineArrowRight,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineFlag,
  HiOutlineRefresh,
  HiOutlineSparkles,
} from "react-icons/hi";

const getValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isWithinCurrentWeek = (date, referenceDate) => {
  const startOfWeek = new Date(referenceDate);
  const day = startOfWeek.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
};

const normalizeStatus = (status) => {
  const normalizedValue = String(status || "").trim().toLowerCase();

  if (normalizedValue === "completed") return "Completed";
  if (["in progress", "in-progress", "inprogress"].includes(normalizedValue)) {
    return "In Progress";
  }

  return "Pending";
};

const UPCOMING_PRIORITY_STYLES = {
  High: {
    dot: "bg-[#B2554A]",
    text: "text-[#B2554A]",
    bg: "bg-[rgba(178,85,74,0.10)]",
    border: "border-[rgba(178,85,74,0.22)]",
    ring: "shadow-[0_0_0_4px_rgba(178,85,74,0.08)]",
  },
  Medium: {
    dot: "bg-[#C28B2C]",
    text: "text-[#9B6E1E]",
    bg: "bg-[rgba(194,139,44,0.12)]",
    border: "border-[rgba(194,139,44,0.24)]",
    ring: "shadow-[0_0_0_4px_rgba(194,139,44,0.08)]",
  },
  Low: {
    dot: "bg-[#4C7F6A]",
    text: "text-[#4C7F6A]",
    bg: "bg-[rgba(76,127,106,0.11)]",
    border: "border-[rgba(76,127,106,0.22)]",
    ring: "shadow-[0_0_0_4px_rgba(76,127,106,0.08)]",
  },
};

const DEFAULT_UPCOMING_PRIORITY_STYLE = {
  dot: "bg-[var(--text-muted)]",
  text: "text-[var(--text-muted)]",
  bg: "bg-[var(--bg-soft)]",
  border: "border-[var(--border)]",
  ring: "shadow-[0_0_0_4px_rgba(111,110,105,0.08)]",
};

const getUpcomingPriorityStyle = (priority) =>
  UPCOMING_PRIORITY_STYLES[priority] || DEFAULT_UPCOMING_PRIORITY_STYLE;

const formatDueDate = (value) => {
  const date = getValidDate(value);

  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const formatDueTime = (value) => {
  const date = getValidDate(value);

  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getDueWindow = (value, referenceDate) => {
  const date = getValidDate(value);

  if (!date) {
    return {
      label: "No date",
      progress: 12,
      tone: "text-[var(--text-muted)]",
    };
  }

  const diffMs = date.getTime() - referenceDate.getTime();
  const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));

  if (diffHours <= 24) {
    return {
      label: "Due today",
      progress: 88,
      tone: "text-[#B2554A]",
    };
  }

  if (diffHours <= 48) {
    return {
      label: "Due tomorrow",
      progress: 68,
      tone: "text-[#C28B2C]",
    };
  }

  if (diffHours <= 168) {
    return {
      label: "This week",
      progress: 48,
      tone: "text-[var(--accent)]",
    };
  }

  return {
    label: "Planned",
    progress: 28,
    tone: "text-[#4C7F6A]",
  };
};

const UserDashboard = () => {
  const { user } = useContext(UserContext);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
        ? "Good Afternoon"
        : "Good Evening";

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const now = new Date();
  const normalizedTasks = tasks.map((task) => {
    const dueDate = getValidDate(task?.dueDate);
    const normalizedStatus = normalizeStatus(task?.status);

    return {
      ...task,
      normalizedStatus,
      dueDateValue: dueDate,
    };
  });

  const completedTasks = normalizedTasks.filter(
    (task) => task.normalizedStatus === "Completed"
  ).length;
  const inProgressTasks = normalizedTasks.filter(
    (task) => task.normalizedStatus === "In Progress"
  ).length;
  const weekTaskCount = normalizedTasks.filter(
    (task) =>
      task.dueDateValue &&
      isWithinCurrentWeek(task.dueDateValue, now) &&
      task.normalizedStatus !== "Completed"
  ).length;
  const overdueTasks = normalizedTasks.filter(
    (task) =>
      task.dueDateValue &&
      task.dueDateValue.getTime() < now.getTime() &&
      task.normalizedStatus !== "Completed"
  ).length;

  const upcomingTasks = normalizedTasks
    .filter(
      (task) =>
        task.dueDateValue &&
        task.dueDateValue.getTime() >= now.getTime() &&
        task.normalizedStatus !== "Completed"
    )
    .sort((leftTask, rightTask) => leftTask.dueDateValue - rightTask.dueDateValue)
    .slice(0, 4);

  const handleUpcomingTaskClick = (taskId) => {
    if (!taskId) {
      toast.error("Task details are unavailable for this item.");
      return;
    }

    navigate(`/user/task-details/${taskId}`);
  };

  useEffect(() => {
    const getUserTasks = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
        setTasks(response.data?.tasks || []);
      } catch (error) {
        console.error("Error fetching user tasks:", error);
      }
    };

    getUserTasks();
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">
                {greeting}, {user?.name || "User"}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{formattedDate}</p>
              <p className="mt-3 max-w-2xl text-sm text-[var(--text-muted)]">
                Your workspace is organized around what needs attention today, what is
                coming next, and the tasks you may want to act on.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 lg:min-w-[250px]">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                This Week
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {weekTaskCount} due this week
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {overdueTasks > 0
                  ? `${overdueTasks} overdue tasks need attention.`
                  : "No overdue tasks right now."}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <InfoCard
            label="My Tasks"
            value={normalizedTasks.length}
            icon={<HiOutlineClipboardList />}
            color="#2F7A84"
          />
          <InfoCard
            label="In Progress"
            value={inProgressTasks}
            icon={<HiOutlineRefresh />}
            color="#2F7A84"
          />
          <InfoCard
            label="Completed"
            value={completedTasks}
            icon={<HiOutlineCheckCircle />}
            color="#4C7F6A"
          />
          <InfoCard
            label="Overdue"
            value={overdueTasks}
            icon={<HiOutlineClock />}
            color="#B2554A"
          />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <TodayTasks tasks={tasks} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(31,111,120,0.12),rgba(76,127,106,0.06)_52%,transparent)] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    <HiOutlineSparkles className="text-sm" aria-hidden="true" />
                    Focus queue
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--text)]">
                    Upcoming Deadlines
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                    Sorted by the closest due date in your active workload.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] shadow-sm">
                  Next {upcomingTasks.length}
                </span>
              </div>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="flex min-h-[245px] flex-col items-center justify-center px-6 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-xl text-[var(--accent)]">
                  <HiOutlineCalendar aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">
                  No upcoming deadlines
                </h3>
                <p className="mt-2 max-w-[260px] text-sm leading-6 text-[var(--text-muted)]">
                  Tasks with future due dates will land here when your schedule fills up.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)] px-3 py-3">
                {upcomingTasks.map((task) => {
                  const priorityStyle = getUpcomingPriorityStyle(task.priority);
                  const dueWindow = getDueWindow(task.dueDate, now);

                  const taskTitle = task.title || "Untitled task";

                  return (
                    <li key={task._id || task.id || taskTitle}>
                      <button
                        type="button"
                        aria-label={`View details for ${taskTitle}`}
                        onClick={() => handleUpcomingTaskClick(task._id || task.id)}
                        className="group grid min-h-[88px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-3 text-left transition-all duration-300 hover:bg-[var(--bg-soft)]/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full border ${priorityStyle.border} ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.ring}`}
                        >
                          <HiOutlineFlag className="text-base" aria-hidden="true" />
                        </span>

                        <span className="min-w-0">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${priorityStyle.dot}`} />
                            <span className="truncate text-sm font-semibold text-[var(--text)] transition-colors duration-300 group-hover:text-[var(--accent)]">
                              {taskTitle}
                            </span>
                          </span>
                          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                            <span className={`font-medium ${dueWindow.tone}`}>
                              {dueWindow.label}
                            </span>
                            <span className={`font-medium sm:hidden ${priorityStyle.text}`}>
                              {task.priority || "No Priority"}
                            </span>
                            <span>
                              {formatDueDate(task.dueDate)} at {formatDueTime(task.dueDate)}
                            </span>
                          </span>
                          <span
                            className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]"
                            aria-hidden="true"
                          >
                            <span
                              className="block h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                              style={{ width: `${dueWindow.progress}%` }}
                            />
                          </span>
                        </span>

                        <span className="flex items-center gap-2">
                          <span className={`hidden rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${priorityStyle.border} ${priorityStyle.bg} ${priorityStyle.text}`}>
                            {task.priority || "No Priority"}
                          </span>
                          <HiOutlineArrowRight className="text-lg text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">My Tasks</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Review assigned work, open details, and keep your next actions visible.
            </p>
          </div>
          <TaskTable tasks={tasks} />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
