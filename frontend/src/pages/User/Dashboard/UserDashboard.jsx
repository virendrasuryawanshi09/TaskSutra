import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import TodayTasks from "./Components/TodayTasks";
import TaskTable from "./Components/TaskTable";
import StatCards from "./Components/statCards";
import {
  HiOutlineArrowRight,
  HiOutlineCalendar,
  HiOutlineFlag,
  HiOutlineSparkles,
} from "react-icons/hi";
import { Helmet } from "react-helmet-async";

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
  const { user, updateUser } = useContext(UserContext);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyDomain, setNewCompanyDomain] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  useEffect(() => {
    if (user?.email && !newCompanyDomain) {
      const domainPart = user.email.split("@")[1];
      if (domainPart) {
        setNewCompanyDomain(domainPart);
      }
    }
  }, [user]);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyDomain.trim()) return;

    setIsCreatingCompany(true);
    const toastId = toast.loading("Deploying company workspace...");
    try {
      const res = await axiosInstance.post("/api/workspace/company", {
        name: newCompanyName.trim(),
        domain: newCompanyDomain.trim(),
      });
      if (res.data && res.data.company) {
        toast.success("Workspace created! You are now the Owner.", { id: toastId });
        if (updateUser) {
          updateUser(res.data.user);
        }
        navigate("/admin/dashboard");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to create workspace.",
        { id: toastId }
      );
    } finally {
      setIsCreatingCompany(false);
    }
  };

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
        setTasks(response?.data?.tasks || []);
      } catch (error) {
        console.error("Error fetching user tasks:", error);
      }
    };

    getUserTasks();
  }, []);

  return (
    <>
      <Helmet>
        <title>Dashboard | TaskSutra</title>
        <meta name="description" content="View your task workload, upcoming deadlines, and progress analytics on your TaskSutra dashboard." />
      </Helmet>
      <DashboardLayout>
        <div className="mx-auto w-full max-w-6xl space-y-6">
        {!user?.companyId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left Box: Info & Join Options */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(76,127,106,0.1)] text-[var(--accent)] border border-[rgba(76,127,106,0.2)]">
                  <HiOutlineSparkles className="text-xl" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-[var(--text)] tracking-tight">Workspace Setup Pending</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  Welcome to TaskSutra! To start managing tasks, you need to join an existing organization or set up a new one.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded border border-[var(--accent)]/20 uppercase shrink-0 mt-0.5">Invite</span>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Check your email for an invitation link sent by your administrator. If you already have one, click it to activate.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded border border-[var(--accent)]/20 uppercase shrink-0 mt-0.5">Domain</span>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      If your company domain has Auto-Join enabled, update your profile email to your work address to auto-join.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-[var(--border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/user/profile")}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-soft)] transition cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Right Box: Create Workspace Form */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">
                  Create a New Workspace
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Establish a secure directory for your company. Registering a workspace automatically designates you as the **CEO / Workspace Owner**.
                </p>

                <form onSubmit={handleCreateCompany} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Acme Corporation"
                      className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                      Workspace Domain
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompanyDomain}
                      onChange={(e) => setNewCompanyDomain(e.target.value)}
                      placeholder="acme.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-200"
                    />
                    <span className="text-[9px] text-[var(--text-muted)] block font-mono pl-0.5">
                      Enter corporate email domain (e.g. acme.com)
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingCompany || !newCompanyName.trim()}
                    className="w-full py-3 mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    {isCreatingCompany ? "Creating Workspace..." : "Create Workspace"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <>
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

            <StatCards
              total={normalizedTasks.length}
              inProgress={inProgressTasks}
              completed={completedTasks}
              overdue={overdueTasks}
            />

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
          </>
        )}
      </div>
    </DashboardLayout>
    </>
  );
};

export default UserDashboard;
