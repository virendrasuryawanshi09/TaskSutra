import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineUser,
} from "react-icons/hi";

const getInitial = (name) => {
  const trimmed = String(name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "U";
};

const UserTeamMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
        setMembers(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError("Unable to load team members.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6">

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            Team Members
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Everyone on your team and a quick look at their workload.
          </p>
        </section>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[76px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
            {error}
          </div>
        ) : members.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 text-center">
            <HiOutlineUser className="text-4xl text-[var(--text-muted)]" />
            <p className="mt-3 text-sm font-medium text-[var(--text)]">No team members yet</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Team members will appear here once they join.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_repeat(3,auto)] items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-soft)] px-5 py-2.5">
              <span />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Member
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Pending
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Active
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Done
              </span>
            </div>

            {members.map((member, index) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
                className="grid grid-cols-[auto_minmax(0,1fr)_repeat(3,auto)] items-center gap-4 border-b border-[var(--border)] px-5 py-3.5 last:border-b-0 hover:bg-[var(--bg-soft)] transition-colors duration-200"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-sm font-semibold text-[var(--accent)]">
                  {member.profileImageUrl ? (
                    <img
                      src={member.profileImageUrl}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitial(member.name)
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text)]">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {member.email}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <HiOutlineClock className="text-sm text-[#C28B2C]" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    {member.pendingTasks ?? 0}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <HiOutlineRefresh className="text-sm text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    {member.inProgressTasks ?? 0}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <HiOutlineCheckCircle className="text-sm text-[#4C7F6A]" />
                  <span className="text-sm font-medium text-[var(--text)]">
                    {member.completedTasks ?? 0}
                  </span>
                </div>
              </motion.div>
            ))}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserTeamMembers;
