import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../../utils/apiPaths";
import axiosInstance from "../../../utils/axiosInstance";

const UserTeamMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getMembers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      setMembers(response.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Unable to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMembers();
  }, []);

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase();

    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  };

  const getNumericCount = (value) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  };

  const extractTasks = (user) => {
    return user.tasks || user.assignedTasks || user.taskList || [];
  };

  const getTaskStatsFromTasks = (tasks = []) => {
    return tasks.reduce(
      (stats, task) => {
        const normalizedStatus = (task?.status || "").trim().toLowerCase();

        stats.total += 1;

        if (normalizedStatus === "completed") {
          stats.completed += 1;
        } else if (
          normalizedStatus === "in progress" ||
          normalizedStatus === "in-progress" ||
          normalizedStatus === "inprogress"
        ) {
          stats.inProgress += 1;
        } else {
          stats.pending += 1;
        }

        return stats;
      },
      {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
      }
    );
  };

  const getTaskStats = (user) => {
    const hasCountFields =
      user?.totalTasks !== undefined ||
      user?.pendingTasks !== undefined ||
      user?.inProgressTasks !== undefined ||
      user?.completedTasks !== undefined;

    if (hasCountFields) {
      const pending = getNumericCount(user.pendingTasks);
      const inProgress = getNumericCount(user.inProgressTasks);
      const completed = getNumericCount(user.completedTasks);
      const totalFromApi = getNumericCount(user.totalTasks);

      return {
        total: totalFromApi || pending + inProgress + completed,
        completed,
        inProgress,
        pending,
      };
    }

    return getTaskStatsFromTasks(extractTasks(user));
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text)]">
              Team Members
            </h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Overview of team activity
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[76px] animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface)]"
              />
            ))
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-500 bg-red-50/10 rounded-lg border border-red-500/20">
              {error}
            </div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--text-muted)]">
              No team members found
            </div>
          ) : (
            members.map((member, index) => {
              const stats = getTaskStats(member);

              return (
                <motion.div
                  key={member._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="
                    flex flex-col sm:flex-row sm:items-center sm:justify-between
                    gap-4
                    px-4 py-4 rounded-lg
                    bg-[var(--surface)]
                    border border-[var(--border)]
                    shadow-sm
                    hover:-translate-y-0.5
                    hover:border-[var(--accent)]
                    hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]
                    transition-all duration-200
                    cursor-pointer
                  "
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="
                        w-9 h-9 rounded-full
                        bg-[var(--bg-soft)]
                        flex items-center justify-center
                        text-[12px] font-medium text-[var(--text)]
                        overflow-hidden shrink-0
                      "
                    >
                      {member.profileImageUrl ? (
                        <img
                          src={member.profileImageUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        getInitials(member.name || "U")
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-medium text-[var(--text)] truncate">
                        {member.name || "Unnamed"}
                      </span>

                      <span className="text-[12px] text-[var(--text-muted)] truncate">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[12px]">
                    <span className="text-[var(--text-muted)]">
                      Total: {stats.total}
                    </span>

                    <button className="text-[var(--accent)] hover:underline font-medium">
                      Edit Profile
                    </button>

                    <span className="text-cyan-500">↻ {stats.inProgress}</span>

                    <span className="text-yellow-500">• {stats.pending}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserTeamMembers;
