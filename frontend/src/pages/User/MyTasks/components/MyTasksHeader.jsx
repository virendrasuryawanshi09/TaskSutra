import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCommandLine,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { getTimeGreeting } from "../myTasks.utils";

const getInitial = (name = "") => {
  const trimmedName = name.trim();
  return trimmedName ? trimmedName.charAt(0).toUpperCase() : "U";
};

const MyTasksHeader = ({ user, searchQuery, onSearchChange }) => {
  const userInitial = useMemo(() => getInitial(user?.name), [user?.name]);

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {getTimeGreeting()}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)] sm:text-3xl">
            My Tasks
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {user?.name ? `${user.name}, focus on the work that needs movement next.` : "Focus on the work that needs movement next."}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:max-w-[560px]">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by title, priority, status, or tag"
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] pl-10 pr-14 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] hover:border-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_1px_var(--accent)]"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] sm:flex">
              <HiOutlineCommandLine className="text-xs" />
              K
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <motion.div
                whileHover={{ y: -1 }}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-sm font-semibold text-[var(--accent)]"
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
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text)]">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  Personal task queue
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTasksHeader;
