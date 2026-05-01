const STATUS_LABELS = {
  pending: "Pending",
  "in progress": "In Progress",
  "in-progress": "In Progress",
  inprogress: "In Progress",
  completed: "Completed",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const TASK_TABS = [
  { key: "all", label: "All Tasks" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

export const getValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeTaskStatus = (status) => {
  const normalizedValue = String(status || "").trim().toLowerCase();
  return STATUS_LABELS[normalizedValue] || "Pending";
};

export const normalizeTaskPriority = (priority) => {
  const normalizedValue = String(priority || "").trim().toLowerCase();
  return PRIORITY_LABELS[normalizedValue] || "Low";
};

export const getTaskProgress = (task = {}) => {
  if (typeof task.progress === "number") {
    return Math.max(0, Math.min(100, task.progress));
  }

  const checklist = task.todoChecklist || task.todoCheckList || [];
  if (!checklist.length) {
    return normalizeTaskStatus(task.status) === "Completed" ? 100 : 0;
  }

  const completedCount = checklist.filter((item) => item?.completed).length;
  return Math.round((completedCount / checklist.length) * 100);
};

export const buildTaskViewModel = (task = {}) => {
  const dueDate = getValidDate(task.dueDate || task.deadline);
  const createdAt = getValidDate(task.createdAt || task.createdOn);
  const status = normalizeTaskStatus(task.status);
  const priority = normalizeTaskPriority(task.priority);
  const checklist = task.todoChecklist || task.todoCheckList || [];
  const progress = getTaskProgress({ ...task, todoChecklist: checklist, status });

  return {
    ...task,
    id: task._id || task.id || task.title,
    status,
    priority,
    dueDateValue: dueDate,
    createdAtValue: createdAt,
    checklist,
    progress,
    tags: Array.isArray(task.tags) ? task.tags.filter(Boolean) : [],
    attachmentCount: Array.isArray(task.attachments) ? task.attachments.length : 0,
    assignedUsers: Array.isArray(task.assignedTo) ? task.assignedTo : [],
    completedChecklistCount: checklist.filter((item) => item?.completed).length,
    checklistCount: checklist.length,
    isCompleted: status === "Completed",
    isInProgress: status === "In Progress",
    isOverdue: Boolean(dueDate && dueDate.getTime() < Date.now() && status !== "Completed"),
  };
};

export const getInitialTab = (viewParam) => {
  const normalizedValue = String(viewParam || "").trim().toLowerCase();

  if (normalizedValue === "completed") return "completed";
  if (normalizedValue === "upcoming") return "in-progress";

  return "all";
};

export const filterTasksByTab = (tasks = [], activeTab = "all") => {
  if (activeTab === "completed") {
    return tasks.filter((task) => task.isCompleted);
  }

  if (activeTab === "in-progress") {
    return tasks.filter((task) => task.isInProgress);
  }

  if (activeTab === "overdue") {
    return tasks.filter((task) => task.isOverdue);
  }

  return tasks;
};

export const filterTasksBySearch = (tasks = [], searchQuery = "") => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return tasks;
  }

  return tasks.filter((task) => {
    const searchableText = [
      task.title,
      task.description,
      task.status,
      task.priority,
      ...(task.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
};

export const getTaskCounts = (tasks = []) => ({
  all: tasks.length,
  "in-progress": tasks.filter((task) => task.isInProgress).length,
  completed: tasks.filter((task) => task.isCompleted).length,
  overdue: tasks.filter((task) => task.isOverdue).length,
});

export const formatTaskDate = (value, options = {}) => {
  const date = getValidDate(value);

  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    ...options,
  }).format(date);
};

export const getDueTone = (task = {}) => {
  if (task.isCompleted) return "completed";
  if (task.isOverdue) return "overdue";

  const dueDate = getValidDate(task.dueDateValue);
  if (!dueDate) return "neutral";

  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
  if (daysUntilDue <= 1) return "urgent";
  if (daysUntilDue <= 3) return "soon";

  return "neutral";
};

export const getTaskTags = (task = {}) => {
  const fallbackTags = [task.priority, task.status].filter(Boolean);
  const sourceTags = task.tags?.length ? task.tags : fallbackTags;

  return sourceTags.slice(0, 3);
};

export const getTimeGreeting = () => {
  const currentHour = new Date().getHours();

  if (currentHour < 12) return "Good morning";
  if (currentHour < 17) return "Good afternoon";
  return "Good evening";
};
