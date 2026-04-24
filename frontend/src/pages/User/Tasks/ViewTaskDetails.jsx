import React from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
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
            </div>

            <div className="space-y-5 pt-5 border-t border-[var(--border)]">
              <h2 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Attachments
              </h2>
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
