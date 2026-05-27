import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
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
  HiOutlineChatBubbleLeftEllipsis,
  HiCheck,
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

const priorityOptions = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

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
  onDiscussionClick,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onDragStart,
  onDragEnter,
  onDragEnd,
}) => {
  const userInitial = useMemo(() => getInitial(user?.name), [user?.name]);
  const activeViewContent = viewContent[activeTab] || viewContent.all;

  return (
    <div className="relative w-full sm:max-w-6xl sm:mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="absolute inset-0 -z-10 opacity-20 blur-3xl bg-[radial-gradient(circle_at_top,rgba(58,166,176,0.2),transparent_60%)]" />
      <div className="min-h-[calc(100vh-9rem)]">
        <main className="min-w-0 w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">
                Tasks
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Manage your workflow efficiently
              </p>
            </div>
          </div>

          <div className="mb-6">
            <Tabs activeTab={activeTab} counts={counts} onChange={onTabChange} />
          </div>

          <div>
            <TaskList
              tasks={tasks}
              loading={loading}
              updatingTaskId={updatingTaskId}
              selectedTaskId={selectedTaskId}
              canReorder={canReorder}
              onTaskClick={onTaskClick}
              onDiscussionClick={onDiscussionClick}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onDueDateChange={onDueDateChange}
              onDragStart={onDragStart}
              onDragEnter={onDragEnter}
              onDragEnd={onDragEnd}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

const Tabs = ({ activeTab, counts, onChange }) => (
  <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
    <div className="flex flex-nowrap min-w-max items-center gap-x-6 border-b border-[var(--border)]">
      {TASK_TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`relative flex min-h-10 items-center gap-2 pb-3 text-[15px] font-semibold transition-colors duration-200 ${isActive ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
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
  onDiscussionClick,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
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
          onDiscussionClick={onDiscussionClick}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onDueDateChange={onDueDateChange}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
};

const InlineStatusDropdown = ({ status, onChange }) => {
  return (
    <Menu as="div" className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <Menu.Button className="flex items-center gap-1.5 rounded p-1 hover:bg-[var(--bg-soft)] transition-colors focus:outline-none">
        <span className={`text-xs font-semibold ${status === "Completed" ? "text-green-600" :
            status === "In Progress" ? "text-blue-500" : "text-gray-500"
          }`}>
          {status}
        </span>
        <span className={`h-1.5 w-1.5 rounded-full ${status === "Completed" ? "bg-green-600" :
            status === "In Progress" ? "bg-blue-500" : "bg-gray-500"
          }`} />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 mt-1 w-36 origin-top-left rounded-md bg-[var(--surface)] border border-[var(--border)] shadow-lg focus:outline-none z-50 overflow-hidden">
          {statusOptions.map((option) => (
            <Menu.Item key={option.value}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={`block w-full text-left px-4 py-2 text-xs transition-colors ${active ? "bg-[var(--bg-soft)]" : ""
                    } ${option.value === status ? "font-bold text-[var(--accent)]" : "text-[var(--text)]"}`}
                >
                  {option.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const InlinePriorityDropdown = ({ priority, onChange }) => {
  return (
    <Menu as="div" className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <Menu.Button className={`rounded-full px-2 py-0.5 text-[10px] font-medium hover:opacity-80 transition-opacity focus:outline-none ${priorityStyles[priority] || "bg-[var(--bg-soft)] text-[var(--text-muted)]"}`}>
        {priority || "No Priority"}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 mt-1 w-32 origin-top-left rounded-md bg-[var(--surface)] border border-[var(--border)] shadow-lg focus:outline-none z-50 overflow-hidden">
          {priorityOptions.map((option) => (
            <Menu.Item key={option.value}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={`block w-full text-left px-4 py-2 text-xs transition-colors ${active ? "bg-[var(--bg-soft)]" : ""
                    } ${option.value === priority ? "font-bold text-[var(--accent)]" : "text-[var(--text)]"}`}
                >
                  {option.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const InlineDateInput = forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors focus:outline-none"
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    ref={ref}
  >
    Due : {value || "Set date"}
  </button>
));
InlineDateInput.displayName = "InlineDateInput";

const InlineDatePicker = ({ date, onChange }) => {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DatePicker
        selected={date}
        onChange={(d) => {
          if (d) {
            onChange(moment(d).format("YYYY-MM-DD"));
          }
        }}
        customInput={<InlineDateInput />}
        dateFormat="MMM dd, yyyy"
        popperPlacement="bottom-start"
        popperClassName="tasksutra-datepicker-popper !z-50"
      />
    </div>
  );
};

const TaskCard = ({
  task,
  index,
  updatingTaskId,
  selected,
  draggable,
  onClick,
  onDiscussionClick,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
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
      className={`group flex flex-col justify-between w-full cursor-pointer rounded-xl border border-[var(--border)] p-4 text-left transition-all duration-300 hover:shadow-md ${selected
        ? "border-[var(--accent)] bg-[rgba(31,111,120,0.04)]"
        : "bg-[var(--surface)] hover:border-[var(--text-muted)]"
        }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <InlineStatusDropdown
              status={task.status}
              onChange={(newStatus) => onStatusChange?.(task, newStatus)}
            />
            <InlinePriorityDropdown
              priority={task.priority}
              onChange={(newPriority) => onPriorityChange?.(task, newPriority)}
            />
          </div>
          <InlineDatePicker
            date={task.dueDateValue}
            onChange={(newDate) => onDueDateChange?.(task, newDate)}
          />
        </div>

        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange?.(task, task.status === "Completed" ? "Pending" : "Completed");
            }}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors focus:outline-none ${task.status === "Completed"
                ? "border-green-500 bg-green-500 text-white"
                : "border-[var(--text-muted)] text-transparent hover:border-green-500 hover:text-green-500"
              }`}
            title={task.status === "Completed" ? "Mark as pending" : "Mark as completed"}
          >
            <HiCheck className="h-3.5 w-3.5" />
          </button>

          <div>
            <h3 className={`text-[15px] font-bold leading-tight mb-1 transition-colors ${task.status === "Completed" ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]"
              }`}>
              {task.title || "Untitled task"}
            </h3>
            <p className="line-clamp-2 text-[13px] text-[var(--text-muted)] mb-4">
              {task.description || "No description added yet."}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="h-[2px] w-full bg-[var(--bg-soft)] rounded-full mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${task.status === "Completed" ? "bg-green-500" : task.status === "In Progress" ? "bg-blue-500" : "bg-gray-300"}`}
            style={{ width: task.status === "Completed" ? "100%" : task.status === "In Progress" ? "50%" : "25%" }}
          />
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[13px] font-medium text-[var(--text-muted)]">
            {formatTaskDate(task.createdAt, { month: "short", day: "2-digit" })}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDiscussionClick?.(task);
              }}
              className="relative text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1"
              title="Open discussion"
            >
              <HiOutlineChatBubbleLeftEllipsis className="text-[18px]" />
              {task.unreadDiscussionCount > 0 && (
                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500"></span>
              )}
            </button>
            <AvatarGroup avatars={task.assignedUsers} max={3} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MyTasksWorkspace;
