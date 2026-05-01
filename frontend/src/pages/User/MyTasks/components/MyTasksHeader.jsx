import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineBell,
  HiOutlineCommandLine,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
} from "react-icons/hi2";
import { getTimeGreeting } from "../myTasks.utils";

const getInitial = (name = "") => {
  const trimmedName = name.trim();
  return trimmedName ? trimmedName.charAt(0).toUpperCase() : "U";
};

const MyTasksHeader = ({ user, searchQuery, onSearchChange, onAddTask }) => {
  const userInitial = useMemo(() => getInitial(user?.name), [user?.name]);

  return (
    <div className="border-b border-[var(--border)] px-5 py-6 sm:px-6 sm:py-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {getTimeGreeting()}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--text)] sm:text-4xl">
            {user?.name ? `${user.name}, your work is organized.` : "My Tasks"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)] sm:text-[15px]">
            Review priorities, search across assigned work, and move through your
            queue with a focused view.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[320px]">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search tasks, tags, priority..."
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] pl-10 pr-11 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] hover:border-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_1px_var(--accent)]"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] sm:flex">
              <HiOutlineCommandLine className="text-xs" />
              K
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
            >
              <HiOutlineBell className="text-lg" />
            </button>

            <button
              type="button"
              onClick={onAddTask}
              className="flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98]"
            >
              <HiOutlinePlus className="text-lg" />
              Add Task
            </button>

            <motion.div
              whileHover={{ y: -1 }}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-sm font-semibold text-[var(--accent)]"
            >
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user?.name || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitial
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTasksHeader;
