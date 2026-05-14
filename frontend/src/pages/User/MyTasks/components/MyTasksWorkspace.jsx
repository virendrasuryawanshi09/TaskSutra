import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineCommandLine,
  HiOutlineFlag,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperClip,
  HiOutlineSparkles,
} from "react-icons/hi2";
import SelectDropdown from "../../../../components/input/SelectDropdown";
import AvatarGroup from "../../../../components/AvatarGroup";
import {
  SORT_OPTIONS,
  TASK_TABS,
  formatTaskDate,
  getDueTone,
  getTaskTags,
  getTimeGreeting,
} from "../myTasks.utils";

const overviewItems = [
  { key: "all", label: "Total", icon: HiArrowTrendingUp },
  { key: "upcoming", label: "Upcoming", icon: HiOutlineCalendarDays },
  { key: "in-progress", label: "Active", icon: HiOutlineClock },
  { key: "completed", label: "Done", icon: HiOutlineCheckCircle },
  { key: "overdue", label: "Late", icon: HiArrowTrendingDown },
];

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

const dueToneStyles = {
  completed: "text-[#4C7F6A]",
  overdue: "text-[#B2554A]",
  urgent: "text-[#B2554A]",
  soon: "text-[#C28B2C]",
  neutral: "text-[var(--text-muted)]",
};

const upcomingPriorityStyles = {
  High: {
    dot: "bg-[#B2554A]",
    text: "text-[#B2554A]",
    bg: "bg-[rgba(178,85,74,0.10)]",
    border: "border-[rgba(178,85,74,0.24)]",
  },
  Medium: {
    dot: "bg-[#C28B2C]",
    text: "text-[#9B6E1E]",
    bg: "bg-[rgba(194,139,44,0.13)]",
    border: "border-[rgba(194,139,44,0.26)]",
  },
  Low: {
    dot: "bg-[#4C7F6A]",
    text: "text-[#4C7F6A]",
    bg: "bg-[rgba(76,127,106,0.12)]",
    border: "border-[rgba(76,127,106,0.24)]",
  },
};

const defaultUpcomingPriorityStyle = {
  dot: "bg-[var(--text-muted)]",
  text: "text-[var(--text-muted)]",
  bg: "bg-[var(--bg-soft)]",
  border: "border-[var(--border)]",
};

const progressTone = {
  Pending: "bg-[#C28B2C]",
  "In Progress": "bg-[var(--accent)]",
  Completed: "bg-[#4C7F6A]",
};

const viewContent = {
  all: {
    title: "My Tasks",
    caption: "Everything assigned to you, ready to sort and review.",
  },
  upcoming: {
    title: "Upcoming",
    caption: "A focused timeline of active tasks with future due dates.",
  },
  "in-progress": {
    title: "In Progress",
    caption: "Active work that is already moving.",
  },
  completed: {
    title: "Completed",
    caption: "Finished work and closed loops.",
  },
  overdue: {
    title: "Overdue",
    caption: "Late tasks that need attention first.",
  },
};

const getUpcomingDueWindow = (task = {}) => {
  if (!task.dueDateValue) {
    return { label: "No date", progress: 12, tone: "text-[var(--text-muted)]" };
  }

  const diffHours = Math.max(0, (task.dueDateValue.getTime() - Date.now()) / 3600000);

  if (diffHours <= 24) {
    return { label: "Due today", progress: 88, tone: "text-[#B2554A]" };
  }

  if (diffHours <= 48) {
    return { label: "Due tomorrow", progress: 68, tone: "text-[#C28B2C]" };
  }

  if (diffHours <= 168) {
    return { label: "This week", progress: 48, tone: "text-[var(--accent)]" };
  }

  return { label: "Planned", progress: 28, tone: "text-[#4C7F6A]" };
};

const getInitial = (name = "") => {
  const trimmedName = name.trim();
  return trimmedName ? trimmedName.charAt(0).toUpperCase() : "U";
};

const MyTasksWorkspace = ({
  user,
  tasks,
  loading,
  counts,
  activeTab,
  searchQuery,
  sortBy,
  updatingTaskId,
  selectedTaskId,
  canReorder,
  onSearchChange,
  onTabChange,
  onSortChange,
  onRefresh,
  onTaskClick,
  onStatusChange,
  onDragStart,
  onDragEnter,
  onDragEnd,
}) => {
  const userInitial = useMemo(() => getInitial(user?.name), [user?.name]);
  const activeViewContent = viewContent[activeTab] || viewContent.all;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-[232px_minmax(0,1fr)]">
          <main className="min-w-0 w-full px-4 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">
                  Tasks
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Manage your workflow efficiently
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
                >
                  <HiOutlineArrowPath className="text-base" />
                  Export
                </button>
              </div>
            </div>

            <div className="mb-6">
              <Tabs activeTab={activeTab} counts={counts} onChange={onTabChange} />
            </div>

            <div>
              {activeTab === "upcoming" ? (
                <UpcomingTaskList
                  tasks={tasks}
                  loading={loading}
                  selectedTaskId={selectedTaskId}
                  onTaskClick={onTaskClick}
                />
              ) : (
                <TaskList
                  tasks={tasks}
                  loading={loading}
                  updatingTaskId={updatingTaskId}
                  selectedTaskId={selectedTaskId}
                  canReorder={canReorder}
                  onTaskClick={onTaskClick}
                  onStatusChange={onStatusChange}
                  onDragStart={onDragStart}
                  onDragEnter={onDragEnter}
                  onDragEnd={onDragEnd}
                />
              )}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};

const Tabs = ({ activeTab, counts, onChange }) => (
  <div className="w-full overflow-x-auto">
    <div className="flex min-w-max items-center gap-6 border-b border-[var(--border)]">
      {TASK_TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`relative flex min-h-10 items-center gap-2 pb-3 text-[15px] font-semibold transition-colors duration-200 ${
              isActive ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="myTasksActiveTab"
                className="absolute bottom-0 left-0 h-[3px] w-full bg-[var(--accent)]"
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            ) : null}
            <span className="relative whitespace-nowrap">{tab.label}</span>
            <span className="relative text-[11px] text-[var(--text-muted)]">
              {counts[tab.key] || 0}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const TaskList = ({
  tasks,
  loading,
  updatingTaskId,
  selectedTaskId,
  canReorder,
  onTaskClick,
  onStatusChange,
  onDragStart,
  onDragEnter,
  onDragEnd,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-[76px] animate-pulse rounded-xl bg-[var(--bg-soft)]" />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)]/35 px-6 text-center">
        <h3 className="text-base font-semibold text-[var(--text)]">No tasks found</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
          Try a different search or switch to another task view.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id || `${task.title}-${index}`}
          task={task}
          index={index}
          updatingTaskId={updatingTaskId}
          selected={selectedTaskId === task.id}
          draggable={canReorder}
          onClick={onTaskClick}
          onStatusChange={onStatusChange}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
};

const UpcomingTaskList = ({ tasks, loading, selectedTaskId, onTaskClick }) => {
  if (loading) {
    return (
      <div className="grid gap-3 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[158px] animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[linear-gradient(135deg,rgba(31,111,120,0.10),rgba(76,127,106,0.05)_54%,transparent)] px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-2xl text-[var(--accent)] shadow-sm">
          <HiOutlineCalendarDays aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-[var(--text)]">
          No upcoming tasks
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
          Tasks with future due dates will appear here as soon as they are assigned.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(31,111,120,0.12),rgba(76,127,106,0.06)_52%,transparent)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              <HiOutlineSparkles className="text-sm" aria-hidden="true" />
              Focus queue
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--text)]">
              Upcoming Deadlines
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Sorted by closest due date across your active workload.
            </p>
          </div>
          <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] shadow-sm">
            {tasks.length} upcoming
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-3 xl:grid-cols-2">
        {tasks.map((task, index) => {
          const priorityStyle = upcomingPriorityStyles[task.priority] || defaultUpcomingPriorityStyle;
          const dueWindow = getUpcomingDueWindow(task);
          const taskTitle = task.title || "Untitled task";
          const isSelected = selectedTaskId === task.id;

          return (
            <motion.button
              key={task.id || `${taskTitle}-${index}`}
              type="button"
              onClick={() => onTaskClick?.(task)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2, ease: "easeOut" }}
              className={`group min-h-[154px] rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                isSelected
                  ? "border-[var(--accent)] bg-[rgba(31,111,120,0.08)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-soft)]/45"
              }`}
              aria-label={`Preview ${taskTitle}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${priorityStyle.border} ${priorityStyle.bg} ${priorityStyle.text}`}
                >
                  <HiOutlineFlag className="text-base" aria-hidden="true" />
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityStyle.border} ${priorityStyle.bg} ${priorityStyle.text}`}>
                  {task.priority || "No Priority"}
                </span>
              </div>

              <div className="mt-4 min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${priorityStyle.dot}`} />
                  <h3 className="truncate text-sm font-semibold text-[var(--text)] transition-colors duration-300 group-hover:text-[var(--accent)]">
                    {taskTitle}
                  </h3>
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[var(--text-muted)]">
                  {task.description || "No description added yet."}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                <span className={`font-medium ${dueWindow.tone}`}>
                  {dueWindow.label}
                </span>
                <span>
                  {formatTaskDate(task.dueDateValue, { year: "numeric" })}
                </span>
              </div>
              <span
                className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                  style={{ width: `${dueWindow.progress}%` }}
                />
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

const TaskCard = ({
  task,
  index,
  updatingTaskId,
  selected,
  draggable,
  onClick,
  onStatusChange,
  onDragStart,
  onDragEnter,
  onDragEnd,
}) => {
  const tags = getTaskTags(task);
  const dueTone = getDueTone(task);
  const isUpdating = updatingTaskId === task.id;

  return (
    <motion.div
      role="row"
      tabIndex={0}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(task)}
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(event, task.id)}
      onDragEnter={(event) => onDragEnter?.(event, task.id)}
      onDragOver={(event) => draggable && event.preventDefault()}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2, ease: "easeOut" }}
      className={`group flex flex-col justify-between w-full cursor-pointer rounded-xl border border-[var(--border)] p-4 text-left transition-all duration-300 hover:shadow-md ${
        selected
          ? "border-[var(--accent)] bg-[rgba(31,111,120,0.04)]"
          : "bg-[var(--surface)] hover:border-[var(--text-muted)]"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${
               task.status === "Completed" ? "text-green-600" : 
               task.status === "In Progress" ? "text-blue-500" : "text-gray-500"
            }`}>
              {task.status}
            </span>
            <span className={`h-1.5 w-1.5 rounded-full ${
               task.status === "Completed" ? "bg-green-600" : 
               task.status === "In Progress" ? "bg-blue-500" : "bg-gray-500"
            }`} />
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            Due : {formatTaskDate(task.dueDateValue, { year: undefined, month: "short", day: "2-digit" })}
          </span>
        </div>

        <h3 className="text-[15px] font-bold text-[var(--text)] leading-tight mb-1">
          {task.title || "Untitled task"}
        </h3>
        <p className="line-clamp-2 text-[13px] text-[var(--text-muted)] mb-4">
          {task.description || "No description added yet."}
        </p>
      </div>

      <div>
        <div className="h-[2px] w-full bg-[var(--bg-soft)] rounded-full mb-3 overflow-hidden">
           <div 
             className={`h-full rounded-full transition-all duration-500 ${task.status === "Completed" ? "bg-green-500" : task.status === "In Progress" ? "bg-blue-500" : "bg-gray-300"}`} 
             style={{ width: task.status === "Completed" ? "100%" : task.status === "In Progress" ? "50%" : "25%" }}
           />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-[var(--text-muted)]">
            {formatTaskDate(task.createdAt, { month: "short", day: "2-digit" })}
          </span>
          <div className="flex items-center gap-2">
            <AvatarGroup avatars={task.assignedUsers} max={3} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MyTasksWorkspace;
