import React from "react";
import { LuTrash2 } from "react-icons/lu";

const DeleteAlert = ({
  open,
  loading = false,
  title = "Delete this task?",
  message = "This action cannot be undone. The task and its checklist data will be removed permanently.",
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
            <LuTrash2 className="text-lg" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--text)]">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              cursor-pointer rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]
              transition-all duration-200 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="
              cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white
              transition-all duration-200 hover:bg-red-600
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            {loading ? "Deleting..." : "Delete Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAlert;
