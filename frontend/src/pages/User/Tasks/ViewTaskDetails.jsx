import React, { useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import DashboardLayout from "../../../components/layouts/DashboardLayout";

const ViewTaskDetails = () => {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const statusOptions = [
    { label: "Pending", tone: "text-[var(--text-muted)]" },
    { label: "In Progress", tone: "text-[#2F7A84]" },
    { label: "Completed", tone: "text-[#4C7F6A]" },
  ];

  const currentStatus = "In Progress";
  const currentPriority = "High";

  const getStatusClassName = (status) => {
    switch (status) {
      case "Completed":
        return "border border-[rgba(76,127,106,0.18)] bg-[rgba(76,127,106,0.14)] text-[#4C7F6A]";
      case "In Progress":
        return "border border-[rgba(47,122,132,0.18)] bg-[rgba(47,122,132,0.14)] text-[#2F7A84]";
      default:
        return "border border-[rgba(148,163,184,0.2)] bg-[var(--bg-soft)] text-[var(--text-muted)]";
    }
  };

  const getPriorityClassName = (priority) => {
    switch (priority) {
      case "High":
        return "bg-[rgba(178,85,74,0.12)] text-[#B2554A]";
      case "Medium":
        return "bg-[rgba(194,139,44,0.12)] text-[#C28B2C]";
      default:
        return "bg-[rgba(76,127,106,0.12)] text-[#4C7F6A]";
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-4xl px-1 py-2 md:py-4">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex flex-col gap-5">
              <div>
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
                >
                  <HiOutlineArrowLeft className="text-base" />
                  Back
                </button>
              </div>

              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">
                    Task Title
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClassName(
                        currentStatus
                      )}`}
                    >
                      {currentStatus}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityClassName(
                        currentPriority
                      )}`}
                    >
                      {currentPriority}
                    </span>
                  </div>
                </div>

                <div className="relative w-full md:w-[190px]">
                  <button
                    type="button"
                    onClick={() => setIsStatusMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--text)] transition-colors duration-200 hover:bg-[var(--bg-soft)]"
                  >
                    <span>{currentStatus}</span>
                    <span
                      className={`text-xs text-[var(--text-muted)] transition-transform duration-200 ${
                        isStatusMenuOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  <div
                    className={`absolute right-0 top-[calc(100%+8px)] z-10 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-200 ${
                      isStatusMenuOpen
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="py-1.5">
                      {statusOptions.map((option) => {
                        const isActive = option.label === currentStatus;

                        return (
                          <button
                            key={option.label}
                            type="button"
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-[var(--bg-soft)] ${
                              isActive ? "bg-[var(--bg-soft)]" : ""
                            }`}
                          >
                            <span className={option.tone}>{option.label}</span>
                            {isActive ? (
                              <span className="text-xs text-[var(--text-muted)]">
                                Active
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Task Info</h2>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Checklist</h2>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Attachments</h2>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Activity / Query
            </h2>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewTaskDetails;
