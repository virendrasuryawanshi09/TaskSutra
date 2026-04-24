import React, { useEffect, useMemo, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { HiOutlineArrowDownTray, HiOutlinePaperClip } from "react-icons/hi2";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import AvatarGroup from "../../../components/AvatarGroup";
import SelectDropdown from "../../../components/input/SelectDropdown";
import TaskDiscussionPanel from "./TaskDiscussionPanel";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

const statusOptions = [
  { label: "Pending" },
  { label: "In Progress" },
  { label: "Completed" },
];

const normalizeStatus = (status) => {
  const normalizedValue = String(status || "").trim().toLowerCase();

  if (normalizedValue === "completed") return "Completed";
  if (["in progress", "in-progress", "inprogress"].includes(normalizedValue)) {
    return "In Progress";
  }

  return "Pending";
};

const getPriorityLabel = (priority = "") => {
  const normalizedValue = String(priority || "").trim().toLowerCase();

  if (normalizedValue === "high") return "High";
  if (normalizedValue === "medium") return "Medium";
  return "Low";
};

const getPriorityDotClassName = (priority) => {
  switch (priority) {
    case "High":
      return "bg-[#B2554A]";
    case "Medium":
      return "bg-[#C28B2C]";
    default:
      return "bg-[#4C7F6A]";
  }
};

const getStatusDotClassName = (status) => {
  switch (status) {
    case "Completed":
      return "bg-[#4C7F6A]";
    case "In Progress":
      return "bg-[var(--accent)]";
    default:
      return "bg-[#C28B2C]";
  }
};

const getInitialMessages = (taskTitle) => [
  {
    id: 1,
    user: "TaskSutra",
    message: taskTitle
      ? `Discussion for "${taskTitle}" starts here.`
      : "Discussion for this task starts here.",
    timestamp: "Now",
  },
];

const formatDate = (value, fallback = "--") => {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const normalizeChecklist = (checklist = []) =>
  (Array.isArray(checklist) ? checklist : []).map((item, index) => ({
    id: item?._id || `${item?.text || "todo"}-${index}`,
    text: String(item?.text || "").trim() || `Checklist item ${index + 1}`,
    completed: Boolean(item?.completed),
  }));

const normalizeAttachments = (attachments = []) =>
  (Array.isArray(attachments) ? attachments : [])
    .filter(Boolean)
    .map((attachment, index) => {
      const url = typeof attachment === "string" ? attachment : attachment?.url || "";
      const rawName =
        typeof attachment === "string"
          ? attachment.split("/").pop()
          : attachment?.name || attachment?.fileName;

      return {
        id: `${url || rawName || "attachment"}-${index}`,
        url,
        name: decodeURIComponent(rawName || `Attachment ${index + 1}`),
      };
    });

const normalizeAssignedUsers = (users = []) =>
  (Array.isArray(users) ? users : []).map((user, index) => ({
    id: user?._id || `${user?.email || "user"}-${index}`,
    name: user?.name || "Team Member",
    email: user?.email || "",
    image: user?.profileImageUrl || "",
  }));

const deriveProgressValue = (status, checklist, fallbackProgress = 0) => {
  if (status === "Completed") return 100;

  if (checklist.length > 0) {
    const completedCount = checklist.filter((item) => item.completed).length;
    return Math.round((completedCount / checklist.length) * 100);
  }

  const numericProgress = Number(fallbackProgress);
  return Number.isFinite(numericProgress) ? numericProgress : 0;
};

const ViewTaskDetails = () => {
  const navigate = useNavigate();
  const { id: taskId } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Pending");
  const [checklistItems, setChecklistItems] = useState([]);
  const [savedChecklistItems, setSavedChecklistItems] = useState([]);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [messages, setMessages] = useState([]);

  const isCompleted = currentStatus === "Completed";

  const visibleChecklistItems = useMemo(
    () =>
      isCompleted
        ? checklistItems.map((item) => ({ ...item, completed: true }))
        : checklistItems,
    [checklistItems, isCompleted]
  );

  const completedChecklistCount = visibleChecklistItems.filter(
    (item) => item.completed
  ).length;
  const progressValue = deriveProgressValue(
    currentStatus,
    visibleChecklistItems,
    task?.progress
  );

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!taskId) {
        setLoading(false);
        setError("Task details are unavailable.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(taskId));
        const taskData = response.data || {};
        const normalizedStatus = normalizeStatus(taskData.status);
        const normalizedChecklist = normalizeChecklist(
          taskData.todoChecklist || taskData.todoCheckList || []
        );
        const normalizedAttachments = normalizeAttachments(taskData.attachments);
        const normalizedUsers = normalizeAssignedUsers(taskData.assignedTo);

        setTask({
          ...taskData,
          title: taskData.title || "Untitled Task",
          description: taskData.description || "No description added yet.",
          priority: getPriorityLabel(taskData.priority),
          status: normalizedStatus,
        });
        setCurrentStatus(normalizedStatus);
        setChecklistItems(normalizedChecklist);
        setSavedChecklistItems(normalizedChecklist);
        setAttachmentFiles(normalizedAttachments);
        setAssignedUsers(normalizedUsers);
        setMessages(getInitialMessages(taskData.title));
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Unable to load task details right now."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  const handleChecklistToggle = (itemId) => {
    if (isCompleted) {
      return;
    }

    setChecklistItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleSendMessage = () => {
    const trimmedMessage = queryInput.trim();

    if (!trimmedMessage) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        user: "You",
        message: trimmedMessage,
        timestamp: "Just now",
      },
    ]);
    setQueryInput("");
  };

  const handleCancelChanges = () => {
    setCurrentStatus(task?.status || "Pending");
    setChecklistItems(savedChecklistItems);
  };

  const handleUpdateTask = async (hasChecklistChanges, hasStatusChanges) => {
    if (!hasChecklistChanges && !hasStatusChanges) {
      return;
    }

    try {
      setIsSaving(true);

      let nextTask = task;
      let nextSavedChecklist = savedChecklistItems;

      if (hasChecklistChanges) {
        const checklistResponse = await axiosInstance.put(
          API_PATHS.TASKS.UPDATE_TODO_CHECKLIST(taskId),
          {
            todoCheckList: checklistItems.map((item) => ({
              text: item.text,
              completed: item.completed,
            })),
          }
        );

        const updatedChecklistTask = checklistResponse.data?.task || {};
        const normalizedChecklist = normalizeChecklist(
          updatedChecklistTask.todoChecklist || updatedChecklistTask.todoCheckList || []
        );
        const normalizedChecklistStatus = normalizeStatus(updatedChecklistTask.status);

        nextSavedChecklist = normalizedChecklist;
        nextTask = {
          ...nextTask,
          ...updatedChecklistTask,
          title: updatedChecklistTask.title || nextTask.title,
          description: updatedChecklistTask.description || nextTask.description,
          priority: getPriorityLabel(updatedChecklistTask.priority || nextTask.priority),
          status: normalizedChecklistStatus,
          progress: updatedChecklistTask.progress ?? nextTask.progress,
        };

        setChecklistItems(normalizedChecklist);
        setSavedChecklistItems(normalizedChecklist);
        setCurrentStatus(normalizedChecklistStatus);
      }

      if (hasStatusChanges || (!hasChecklistChanges && hasStatusChanges)) {
        const statusResponse = await axiosInstance.put(
          API_PATHS.TASKS.UPDATE_TASK_STATUS(taskId),
          { status: currentStatus }
        );

        const updatedStatusTask = statusResponse.data?.task || {};
        const normalizedStatusValue = normalizeStatus(updatedStatusTask.status);
        const normalizedChecklist = normalizeChecklist(
          updatedStatusTask.todoChecklist || updatedStatusTask.todoCheckList || nextSavedChecklist
        );

        nextTask = {
          ...nextTask,
          ...updatedStatusTask,
          title: updatedStatusTask.title || nextTask.title,
          description: updatedStatusTask.description || nextTask.description,
          priority: getPriorityLabel(updatedStatusTask.priority || nextTask.priority),
          status: normalizedStatusValue,
          progress: updatedStatusTask.progress ?? nextTask.progress,
        };

        setCurrentStatus(normalizedStatusValue);
        setChecklistItems(normalizedChecklist);
        setSavedChecklistItems(normalizedChecklist);
      }

      setTask({
        ...nextTask,
        status: normalizeStatus(nextTask.status),
        priority: getPriorityLabel(nextTask.priority),
      });

      toast.success("Task updated successfully.");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message || "Unable to update task."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto my-6 px-1 md:my-10">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6 text-sm text-[var(--text-muted)]">
            Loading task details...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !task) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto my-6 px-1 md:my-10">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
            <p className="text-sm text-[var(--text)]">{error || "Task not found."}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasChecklistChanges =
    JSON.stringify(
      checklistItems.map((item) => ({
        text: item.text,
        completed: item.completed,
      }))
    ) !==
    JSON.stringify(
      savedChecklistItems.map((item) => ({
        text: item.text,
        completed: item.completed,
      }))
    );

  const hasStatusChanges = currentStatus !== task.status;
  const hasPendingChanges = hasChecklistChanges || hasStatusChanges;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto my-6 px-1 md:my-10">
        <div
          className="
            bg-[var(--surface)]
            border border-[var(--border)]
            rounded-2xl p-4 md:p-6
            shadow-sm
          "
        >
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
              >
                <HiOutlineArrowLeft className="text-base" />
                Back
              </button>

              <h1 className="mt-3 text-xl font-semibold text-[var(--text)] tracking-tight">
                {task.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${getStatusDotClassName(
                      currentStatus
                    )}`}
                  ></span>
                  <span>{currentStatus}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${getPriorityDotClassName(
                      task.priority
                    )}`}
                  ></span>
                  <span>{task.priority}</span>
                </div>
              </div>

              <div className="mt-4 max-w-[280px] space-y-2">
                <div className="h-[4px] overflow-hidden rounded-full bg-[var(--bg-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                  <span>{progressValue}% complete</span>
                  {isCompleted ? (
                    <span className="text-[var(--text)]">Completed</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="w-full md:w-[220px]">
              <SelectDropdown
                label="Status"
                options={statusOptions}
                value={currentStatus}
                onChange={setCurrentStatus}
              />

              <button
                type="button"
                onClick={() => setIsDiscussionOpen(true)}
                className="
                  mt-3
                  w-full
                  rounded-lg
                  border border-[var(--border)]
                  bg-[var(--surface)]
                  px-4 py-2.5
                  text-sm font-medium text-[var(--text)]
                  transition-colors duration-200
                  hover:bg-[var(--bg-soft)]
                "
              >
                Open Discussion
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-5">
              <h2 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Task Information
              </h2>

              <div className="space-y-2">
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Description
                </label>
                <p
                  className="
                    w-full
                    bg-[var(--bg-soft)]
                    border border-[var(--border)]
                    rounded-lg
                    px-3 py-3
                    text-sm leading-6 text-[var(--text)]
                  "
                >
                  {task.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs text-[var(--text-muted)]">
                    Created Date
                  </label>
                  <div
                    className="
                      bg-[var(--bg-soft)]
                      border border-[var(--border)]
                      rounded-lg
                      px-3 py-2.5
                      text-sm text-[var(--text)]
                    "
                  >
                    {formatDate(task.createdAt)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-[var(--text-muted)]">
                    Due Date
                  </label>
                  <div
                    className="
                      bg-[var(--bg-soft)]
                      border border-[var(--border)]
                      rounded-lg
                      px-3 py-2.5
                      text-sm text-[var(--text)]
                    "
                  >
                    {isCompleted ? "Completed" : formatDate(task.dueDate)}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-[var(--text-muted)]">
                  Assigned Users
                </label>
                <div
                  className="
                    bg-[var(--bg-soft)]
                    border border-[var(--border)]
                    rounded-lg
                    px-3 py-3
                  "
                >
                  <div className="flex items-center gap-3">
                    <AvatarGroup avatars={assignedUsers} />
                    <span className="text-sm text-[var(--text-muted)]">
                      {assignedUsers.length > 0
                        ? `${assignedUsers.length} assigned`
                        : "No users assigned"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 pt-5 border-t border-[var(--border)]">
              <h2 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Checklist
              </h2>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--text-muted)]">
                  {completedChecklistCount} of {visibleChecklistItems.length} completed
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                {visibleChecklistItems.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[var(--text-muted)] bg-[var(--surface)]">
                    No checklist items added.
                  </div>
                ) : (
                  visibleChecklistItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleChecklistToggle(item.id)}
                      disabled={isCompleted}
                      className="flex w-full items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition-colors duration-200 hover:bg-[rgba(31,31,29,0.025)] disabled:cursor-not-allowed disabled:hover:bg-[var(--surface)] dark:hover:bg-[rgba(255,255,255,0.03)] last:border-b-0"
                    >
                      <span className="w-8 shrink-0 text-xs font-medium tracking-[0.12em] text-[var(--text-muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                          item.completed
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--border)] bg-[var(--surface)] text-transparent"
                        }`}
                      >
                        <span className="text-[10px] leading-none">✓</span>
                      </span>

                      <span
                        className={`min-w-0 text-sm ${
                          item.completed
                            ? "text-[var(--text-muted)] line-through"
                            : "text-[var(--text)]"
                        }`}
                      >
                        {item.text}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-5 pt-5 border-t border-[var(--border)]">
              <h2 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Attachments
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Upload File
                  </label>
                  <input
                    type="file"
                    className="
                      w-full
                      bg-[var(--bg-soft)]
                      border border-[var(--border)]
                      rounded-lg
                      px-3 py-2.5
                      text-sm text-[var(--text)]
                      file:mr-3 file:rounded-md file:border-0
                      file:bg-[var(--surface)] file:px-3 file:py-1.5
                      file:text-sm file:text-[var(--text)]
                    "
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                  {attachmentFiles.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--text-muted)] bg-[var(--surface)]">
                      No attachments added.
                    </div>
                  ) : (
                    attachmentFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 last:border-b-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <HiOutlinePaperClip className="shrink-0 text-sm text-[var(--text-muted)]" />
                          <span className="truncate text-sm text-[var(--text)]">
                            {file.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
                        >
                          <HiOutlineArrowDownTray className="text-sm" />
                          Download
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5 pt-5 border-t border-[var(--border)]">
              <h2 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Activity / Query
              </h2>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-5 border-t border-[var(--border)] md:flex-row md:justify-end">
              <button
                type="button"
                onClick={handleCancelChanges}
                disabled={!hasPendingChanges || isSaving}
                className="
                  w-full px-4 py-2 text-sm
                  rounded-lg border border-[var(--border)]
                  text-[var(--text-muted)]
                  hover:bg-[var(--bg-soft)]
                  hover:text-[var(--text)]
                  transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-60
                  md:w-auto
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleUpdateTask(hasChecklistChanges, hasStatusChanges)}
                disabled={!hasPendingChanges || isSaving}
                className="
                  w-full px-5 py-2 text-sm font-medium
                  rounded-lg
                  bg-[var(--accent)]
                  text-white
                  hover:bg-[var(--accent-hover)]
                  transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-60
                  md:w-auto
                "
              >
                {isSaving ? "Updating..." : "Update Task"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <TaskDiscussionPanel
        isOpen={isDiscussionOpen}
        onClose={() => setIsDiscussionOpen(false)}
        messages={messages}
        queryInput={queryInput}
        onQueryInputChange={(event) => setQueryInput(event.target.value)}
        onSend={handleSendMessage}
      />
    </DashboardLayout>
  );
};

export default ViewTaskDetails;
