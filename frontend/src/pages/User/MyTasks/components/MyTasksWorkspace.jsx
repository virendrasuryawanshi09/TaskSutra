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
          <aside className="border-b border-[var(--border)] bg-[var(--bg-soft)]/30 px-4 py-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--accent)]">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={user?.name || "User"} className="h-full w-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text)]">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  Personal queue
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Focus
              </p>
              <div className="mt-3 space-y-1">
                {overviewItems.map(({ key, label, icon: Icon }) => {
                  const isActive = activeTab === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onTabChange(key)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                        isActive
                          ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface)]/70 hover:text-[var(--text)]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="text-base text-[var(--accent)]" />
                        <span className="text-sm font-medium">{label}</span>
                      </span>
                      <span className="text-sm font-semibold">{counts[key] || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="shrink-0">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {getTimeGreeting()}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                    {activeViewContent.title}
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {loading ? "Loading queue..." : activeViewContent.caption}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 xl:max-w-[760px]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)]/55 p-2">
                    <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_160px_40px] xl:items-end">
                      <div className="relative">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--text-muted)]" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => onSearchChange(event.target.value)}
                      placeholder="Search by title, status, priority, or tag"
                      className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-14 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] hover:border-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] sm:flex">
                      <HiOutlineCommandLine className="text-xs" />
                      K
                    </span>
                      </div>

                      <div>
                        <SelectDropdown
                          label="Sort"
                          options={SORT_OPTIONS}
                          value={sortBy}
                          onChange={onSortChange}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onRefresh}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-all duration-200 hover:border-[var(--text-muted)] hover:text-[var(--text)]"
                        aria-label="Refresh tasks"
                      >
                        <HiOutlineArrowPath className="text-base" />
                      </button>
                    </div>
                  </div>

                  <Tabs activeTab={activeTab} counts={counts} onChange={onTabChange} />
                </div>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
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
            className={`relative flex min-h-10 items-center gap-2 pb-2 text-sm font-medium transition-colors duration-200 ${
              isActive ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="myTasksActiveTab"
                className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[var(--accent)]"
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
    <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
      {tasks.map((task, index) => (
        <TaskRow
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

const TaskRow = ({
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
    <motion.button
      type="button"
      onClick={() => onClick?.(task)}
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(event, task.id)}
      onDragEnter={(event) => onDragEnter?.(event, task.id)}
      onDragOver={(event) => draggable && event.preventDefault()}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2, ease: "easeOut" }}
      className={`group grid w-full grid-cols-1 gap-3 border-b border-[var(--border)] px-4 py-3.5 text-left transition-all duration-200 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_150px_110px_120px_34px] ${
        selected
          ? "bg-[rgba(31,111,120,0.08)] shadow-[inset_3px_0_0_var(--accent)]"
          : "bg-[var(--surface)] hover:bg-[var(--bg-soft)]/55"
      }`}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${progressTone[task.status] || "bg-[var(--text-muted)]"}`} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--text)]">
              {task.title || "Untitled task"}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-[var(--text-muted)]">
              {task.description || "No description added yet."}
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 pl-5">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div onClick={(event) => event.stopPropagation()}>
        <SelectDropdown
          options={statusOptions}
          value={task.status}
          onChange={(value) => onStatusChange?.(task, value)}
        />
        {isUpdating ? <p className="mt-1 text-[11px] text-[var(--text-muted)]">Updating...</p> : null}
      </div>

      <div className="flex items-center lg:justify-start">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority] || "bg-[var(--bg-soft)] text-[var(--text-muted)]"}`}>
          {task.priority}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <HiOutlineCalendarDays className="text-base text-[var(--text-muted)]" />
        <span className={dueToneStyles[dueTone]}>
          {formatTaskDate(task.dueDateValue, { year: "numeric" })}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <div className="lg:hidden">
          <AvatarGroup avatars={task.assignedUsers} />
        </div>
        <span className="hidden lg:block">
          <HiOutlineChevronRight className="text-lg text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--accent)]" />
        </span>
        {task.attachmentCount > 0 ? (
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] lg:hidden">
            <HiOutlinePaperClip />
            {task.attachmentCount}
          </span>
        ) : null}
      </div>
    </motion.button>
  );
};

export default MyTasksWorkspace;
