import React, { useMemo, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { HiOutlineArrowDownTray, HiOutlinePaperClip } from "react-icons/hi2";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import AvatarGroup from "../../../components/AvatarGroup";
import SelectDropdown from "../../../components/input/SelectDropdown";

const ViewTaskDetails = () => {
  const statusOptions = [
    { label: "Pending" },
    { label: "In Progress" },
    { label: "Completed" },
  ];

  const currentStatus = "In Progress";
  const currentPriority = "High";
  const isCompleted = currentStatus === "Completed";
  const assignedUsers = [
    { name: "Alex Carter" },
    { name: "Sana Patel" },
    { name: "Ishaan Roy" },
  ];
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: "Review task requirements", completed: true },
    { id: 2, text: "Prepare implementation notes", completed: true },
    { id: 3, text: "Build requested screen updates", completed: false },
    { id: 4, text: "Verify responsive behavior", completed: false },
    { id: 5, text: "Prepare final handoff", completed: false },
  ]);
  const [attachmentFiles] = useState([
    { id: 1, name: "dashboard-wireframe.pdf" },
    { id: 2, name: "task-flow-notes.docx" },
    { id: 3, name: "qa-checklist.xlsx" },
  ]);

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

  const getStatusDotClassName = (status) => {
    switch (status) {
      case "Completed":
        return "bg-[#4C7F6A]";
      case "In Progress":
        return "bg-[var(--accent)]";
      default:
        return "bg-[var(--text-muted)]";
    }
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

  const handleChecklistToggle = (itemId) => {
    if (isCompleted) {
      return;
    }

    setChecklistItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

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
                className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
              >
                <HiOutlineArrowLeft className="text-base" />
                Back
              </button>

              <h1 className="mt-3 text-xl font-semibold text-[var(--text)] tracking-tight">
                Task Title
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
                      currentPriority
                    )}`}
                  ></span>
                  <span>{currentPriority}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[220px]">
              <SelectDropdown
                label="Status"
                options={statusOptions}
                value={currentStatus}
                onChange={() => {}}
              />
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
                  Task description will appear here.
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
                    12 Apr 2026
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
                    {isCompleted ? "Completed" : "18 Apr 2026"}
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
                      {assignedUsers.length} assigned
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
                {visibleChecklistItems.map((item, index) => (
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
                ))}
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
                  {attachmentFiles.map((file) => (
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
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5 pt-5 border-t border-[var(--border)]">
              <h2 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Activity / Query
              </h2>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewTaskDetails;
