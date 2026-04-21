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
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineRefresh,
} from "react-icons/hi";

const getValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameDay = (leftDate, rightDate) =>
  leftDate.getFullYear() === rightDate.getFullYear() &&
  leftDate.getMonth() === rightDate.getMonth() &&
  leftDate.getDate() === rightDate.getDate();

const normalizeStatus = (status) => {
  const normalizedValue = String(status || "").trim().toLowerCase();

  if (normalizedValue === "completed") return "Completed";
  if (["in progress", "in-progress", "inprogress"].includes(normalizedValue)) {
    return "In Progress";
  }

  return "Pending";
};

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
  const todayTaskCount = normalizedTasks.filter(
    (task) => task.dueDateValue && isSameDay(task.dueDateValue, now)
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
                Today Summary
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {todayTaskCount} due today
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

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--text)]">Upcoming Deadlines</h2>
              <span className="text-xs text-[var(--text-muted)]">
                Next {upcomingTasks.length}
              </span>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                No upcoming deadlines yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {upcomingTasks.map((task) => (
                  <li
                    key={task._id || task.id || task.title}
                  >
                    <button
                      type="button"
                      onClick={() => handleUpcomingTaskClick(task._id || task.id)}
                      className="group flex w-full items-start justify-between gap-4 rounded-2xl border border-transparent px-3 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-[var(--bg-soft)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text)] transition-colors duration-300 group-hover:text-[var(--accent)]">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          Due {formatDueDate(task.dueDate)} at {formatDueTime(task.dueDate)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] transition-colors duration-300 group-hover:text-[var(--text)]">
                        {task.priority || "No Priority"}
                      </span>
                    </button>
                  </li>
                ))}
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
