import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([]);

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      setAllUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    getAllUsers();
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
    <DashboardLayout activeMenu="manage-users">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
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
          {allUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--text-muted)]">
              No users found
            </div>
          ) : (
            allUsers.map((user) => {
              const stats = getTaskStats(user);

              return (
                <div
                  key={user._id}
                  className="
                    flex flex-col sm:flex-row sm:items-center sm:justify-between
                    gap-4
                    px-4 py-4 rounded-lg
                    bg-[var(--surface)]
                    border border-[var(--border)]
                    shadow-sm
                    hover:-translate-y-0.5
                    hover:border-slate-300/70
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
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        getInitials(user.name || "U")
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-medium text-[var(--text)] truncate">
                        {user.name || "Unnamed"}
                      </span>

                      <span className="text-[12px] text-[var(--text-muted)] truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[12px]">
                    <span className="text-[var(--text-muted)]">
                      Total: {stats.total}
                    </span>

                    <span className="text-green-500">✓ {stats.completed}</span>

                    <span className="text-cyan-500">↻ {stats.inProgress}</span>

                    <span className="text-yellow-500">• {stats.pending}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
