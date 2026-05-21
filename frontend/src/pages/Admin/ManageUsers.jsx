import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { downloadReport } from "../../utils/downloadReport";
import { LuFileSpreadsheet, LuUserPlus } from "react-icons/lu";
import toast from "react-hot-toast";
import useUserAuth from "../../hooks/useUserAuth.jsx";

const ManageUsers = () => {
  const { user: currentUser } = useUserAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // Invite states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isInviting, setIsInviting] = useState(false);

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

  const handleExportUsersReport = async () => {
    const toastId = toast.loading("Preparing users report...");

    try {
      setIsExporting(true);
      await downloadReport({
        url: API_PATHS.REPORTS.EXPORT_USERS,
        fallbackFileName: "user_report.xlsx",
      });
      toast.success("Users report downloaded successfully.", { id: toastId });
    } catch (error) {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to download users report.",
        { id: toastId }
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    const toastId = toast.loading("Generating invitation link...");
    try {
      const res = await axiosInstance.post("/api/workspace/invitations", {
        email: inviteEmail.trim(),
      });
      if (res.data && res.data.inviteLink) {
        setGeneratedLink(res.data.inviteLink);
        toast.success("Invitation generated!", { id: toastId });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to generate invitation.",
        { id: toastId }
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveUser = async (userToRemove) => {
    const confirmText = `Are you sure you want to remove ${userToRemove.name || userToRemove.email} from the workspace? All assigned tasks will be unassigned.`;
    if (!window.confirm(confirmText)) return;

    const toastId = toast.loading(`Removing ${userToRemove.name || "member"}...`);
    try {
      await axiosInstance.delete(`/api/workspace/members/${userToRemove._id}`);
      setAllUsers((prev) => prev.filter((u) => u._id !== userToRemove._id));
      toast.success("Member removed successfully.", { id: toastId });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to remove member.",
        { id: toastId }
      );
    }
  };

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text)]">
              Team Members
            </h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Overview of team activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="
                w-fit
                flex items-center justify-center gap-2
                px-4 py-2.5 text-sm font-medium
                rounded-xl
                bg-[var(--accent)]
                text-white
                shadow-sm
                hover:bg-[var(--accent-hover)]
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              <LuUserPlus />
              Invite Member
            </button>

            <button
              type="button"
              onClick={handleExportUsersReport}
              disabled={isExporting}
              className="
                w-fit
                flex items-center justify-center gap-2
                px-4 py-2.5 text-sm font-medium
                rounded-xl
                bg-[var(--bg-soft)]
                text-[var(--text)]
                border border-[var(--border)]
                shadow-sm
                hover:bg-[var(--border)]
                disabled:cursor-not-allowed
                disabled:opacity-70
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              <LuFileSpreadsheet />
              {isExporting ? "Exporting..." : "Export Report"}
            </button>
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
              const isSelf = currentUser && (currentUser._id === user._id || currentUser.email === user.email);

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
                    hover:border-[var(--accent)]
                    hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]
                    transition-all duration-200
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

                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-[13px] font-medium text-[var(--text)] truncate">
                        {user.name || "Unnamed"} {isSelf && "(You)"}
                      </span>

                      <span className="text-[12px] text-[var(--text-muted)] truncate">
                        {user.email}
                      </span>

                      {user.skills && user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {user.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-[12px]">
                      <span className="text-[var(--text-muted)]">
                        Total: {stats.total}
                      </span>

                      <span className="text-green-500">✓ {stats.completed}</span>

                      <span className="text-cyan-500">↻ {stats.inProgress}</span>

                      <span className="text-yellow-500">• {stats.pending}</span>
                    </div>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUser(user);
                        }}
                        className="
                          p-2 rounded-xl
                          border border-red-500 border-opacity-20
                          text-red-500
                          hover:bg-red-500 hover:text-white hover:border-transparent
                          transition-all duration-200
                          active:scale-[0.95]
                          shrink-0
                        "
                        title="Remove member"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
              Invite Workspace Member
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Enter their email address. A 10-minute secure signup link will be generated.
            </p>

            {!generatedLink ? (
              <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[var(--text)] font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="
                      w-full px-3.5 py-2.5 text-sm 
                      bg-[var(--bg-soft)] border border-[var(--border)] 
                      rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] 
                      focus:outline-none focus:border-[var(--accent)]
                      transition duration-150
                    "
                  />
                </div>

                <div className="flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setInviteEmail("");
                    }}
                    className="
                      px-4 py-2 text-sm font-medium 
                      border border-[var(--border)] rounded-xl 
                      text-[var(--text)] hover:bg-[var(--bg-soft)] 
                      transition duration-150
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail.trim()}
                    className="
                      px-4 py-2 text-sm font-medium 
                      bg-[var(--accent)] text-white rounded-xl 
                      hover:bg-[var(--accent-hover)] 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition duration-150
                    "
                  >
                    {isInviting ? "Generating..." : "Generate Invite"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-3 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 rounded-xl text-center">
                  <p className="text-[11px] text-green-500 font-semibold mb-1">
                    Invitation Link Generated!
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    This link will expire in exactly 10 minutes.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[var(--text)] font-medium">
                    Signup URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="
                        w-full px-3 py-2 text-xs 
                        bg-[var(--bg-soft)] border border-[var(--border)] 
                        rounded-xl text-[var(--text)] focus:outline-none
                      "
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        toast.success("Link copied to clipboard!");
                      }}
                      className="
                        px-3.5 py-2 text-xs font-semibold 
                        bg-[var(--accent)] text-white rounded-xl 
                        hover:bg-[var(--accent-hover)] transition shrink-0
                      "
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setInviteEmail("");
                      setGeneratedLink("");
                    }}
                    className="
                      px-4 py-2 text-sm font-medium 
                      bg-[var(--accent)] text-white rounded-xl 
                      hover:bg-[var(--accent-hover)] transition
                    "
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageUsers;
