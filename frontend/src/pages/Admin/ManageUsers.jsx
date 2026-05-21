import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { downloadReport } from "../../utils/downloadReport";
import { LuFileSpreadsheet, LuUserPlus } from "react-icons/lu";
import toast from "react-hot-toast";
import useUserAuth from "../../hooks/useUserAuth.jsx";

const ManageUsers = () => {
  const { user: currentUser, updateUser } = useUserAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // Tabs and Company details
  const [activeTab, setActiveTab] = useState("members");
  const [companyDetails, setCompanyDetails] = useState(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // Setup Company State
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyDomain, setNewCompanyDomain] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Invite states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Domain verification states
  const [verificationMethod, setVerificationMethod] = useState("otp");
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [activeVerification, setActiveVerification] = useState(null);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);

  const handleRoleChange = async (userToUpdate, newRole) => {
    const toastId = toast.loading(`Updating ${userToUpdate.name || "member"}'s role to ${newRole}...`);
    try {
      await axiosInstance.put(`/api/workspace/members/${userToUpdate._id}`, {
        role: newRole,
      });
      setAllUsers((prev) =>
        prev.map((u) => (u._id === userToUpdate._id ? { ...u, role: newRole } : u))
      );
      toast.success(`Role updated to ${newRole} successfully.`, { id: toastId });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update role.",
        { id: toastId }
      );
    }
  };

  const handleVerifyDomainStart = async (e) => {
    e.preventDefault();
    setIsVerifyingDomain(true);
    const toastId = toast.loading("Initiating domain verification...");
    try {
      const res = await axiosInstance.post("/api/workspace/verify-domain", {
        method: verificationMethod,
      });
      if (res.data && res.data.success) {
        setActiveVerification({
          code: res.data.verificationCode,
          method: verificationMethod,
        });
        await fetchCompanyDetails();
        toast.success(res.data.message || "Verification code generated!", { id: toastId });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to initiate domain verification.",
        { id: toastId }
      );
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleConfirmDomain = async (e) => {
    e.preventDefault();
    if (!verificationCodeInput.trim()) return;

    setIsVerifyingDomain(true);
    const toastId = toast.loading("Confirming verification...");
    try {
      const res = await axiosInstance.post("/api/workspace/confirm-domain", {
        code: verificationCodeInput.trim(),
      });
      if (res.data && res.data.success) {
        setCompanyDetails(res.data.company);
        setActiveVerification(null);
        setVerificationCodeInput("");
        toast.success("Domain verified successfully!", { id: toastId });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Verification failed.",
        { id: toastId }
      );
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleCancelVerification = () => {
    setActiveVerification(null);
    setVerificationCodeInput("");
  };

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      setAllUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchCompanyDetails = async () => {
    setIsLoadingCompany(true);
    try {
      const res = await axiosInstance.get("/api/workspace/company");
      if (res.data && res.data.company) {
        setCompanyDetails(res.data.company);
      } else {
        setCompanyDetails(null);
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyDomain.trim()) return;

    setIsCreatingCompany(true);
    const toastId = toast.loading("Creating workspace...");
    try {
      const res = await axiosInstance.post("/api/workspace/company", {
        name: newCompanyName.trim(),
        domain: newCompanyDomain.trim(),
      });
      if (res.data && res.data.company) {
        setCompanyDetails(res.data.company);
        
        // Update user context with new role ('ceo') and company details
        if (res.data.user) {
          updateUser({
            ...currentUser,
            role: res.data.user.role,
            companyId: res.data.user.companyId,
            company: res.data.user.company,
          });
        }
        
        toast.success("Workspace created! You are now the Owner.", { id: toastId });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to create workspace.",
        { id: toastId }
      );
    } finally {
      setIsCreatingCompany(false);
    }
  };

  useEffect(() => {
    getAllUsers();
    fetchCompanyDetails();

    if (currentUser && currentUser.email) {
      const domainPart = currentUser.email.split("@")[1];
      if (domainPart) {
        setNewCompanyDomain(domainPart);
      }
    }
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
        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border)] mb-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer ${
              activeTab === "members"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Team Members
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer ${
              activeTab === "settings"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Workspace & Domain Settings
          </button>
        </div>

        {activeTab === "members" ? (
          <>
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

                        {/* Role Selector / Badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          {user.role === "ceo" ? (
                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-yellow-500 bg-opacity-10 text-yellow-600 border border-yellow-500 border-opacity-20 shadow-sm">
                              Owner / CEO
                            </span>
                          ) : (
                            <select
                              value={user.role || "member"}
                              disabled={
                                currentUser?.role !== "ceo" ||
                                user.role === "ceo" ||
                                isSelf
                              }
                              onChange={(e) => handleRoleChange(user, e.target.value)}
                              className="
                                px-2.5 py-1 text-xs font-semibold
                                bg-[var(--bg-soft)] border border-[var(--border)] 
                                rounded-xl text-[var(--text)]
                                focus:outline-none focus:border-[var(--accent)]
                                disabled:opacity-75 disabled:cursor-not-allowed
                                transition-all duration-150
                                cursor-pointer
                              "
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </div>

                        {!isSelf && user.role !== "ceo" && (
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
          </>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            {isLoadingCompany ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                Loading workspace settings...
              </div>
            ) : !companyDetails ? (
              /* Create Workspace Form */
              <div className="max-w-md mx-auto py-4">
                <h3 className="text-md font-semibold text-[var(--text)] mb-1 text-left">
                  Setup your B2B Workspace
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-5 text-left">
                  Register your organization workspace. Once verified, other employees with matching email domains can auto-join.
                </p>
                <form onSubmit={handleCreateCompany} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold text-[var(--text)]">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition duration-150"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold text-[var(--text)]">
                      Workspace Domain
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompanyDomain}
                      onChange={(e) => setNewCompanyDomain(e.target.value)}
                      placeholder="e.g. acme.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition duration-150"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingCompany || !newCompanyName.trim()}
                    className="w-full py-2.5 mt-2 bg-[var(--accent)] text-white font-medium text-sm rounded-xl hover:bg-[var(--accent-hover)] transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isCreatingCompany ? "Creating Workspace..." : "Create Workspace"}
                  </button>
                </form>
              </div>
            ) : (
              /* Company Info Card (placeholder/dashboard layout) */
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-5 mb-5 gap-4">
                  <div className="text-left">
                    <h3 className="text-md font-semibold text-[var(--text)]">
                      {companyDetails.name} Workspace
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Organization settings and verification details
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">Status:</span>
                    {companyDetails.isVerified ? (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500 bg-opacity-10 text-green-500 border border-green-500 border-opacity-20 flex items-center gap-1">
                        Verified Domain
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-500 bg-opacity-10 text-yellow-500 border border-yellow-500 border-opacity-20 flex items-center gap-1">
                        Unverified Domain
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {/* General settings stats */}
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-[var(--bg-soft)] rounded-xl border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)]">Organization Domain</p>
                      <p className="text-sm font-semibold mt-1 uppercase">{companyDetails.domain}</p>
                    </div>

                    <div className="p-4 bg-[var(--bg-soft)] rounded-xl border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)]">Workspace Owner</p>
                      <p className="text-sm font-semibold mt-1">
                        {currentUser?.role === "ceo" ? "You (CEO)" : "CEO"}
                      </p>
                    </div>
                  </div>

                  {/* Domain Verification Control Card */}
                  <div className="p-6 border border-[var(--border)] bg-[var(--surface)] rounded-2xl flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shrink-0 ${
                        companyDetails.isVerified 
                          ? "bg-green-500 bg-opacity-10 text-green-500 border border-green-500 border-opacity-10" 
                          : "bg-[var(--accent)] bg-opacity-10 text-[var(--accent)] border border-[var(--accent)] border-opacity-10"
                      }`}>
                        {companyDetails.isVerified ? "✓" : "⚡"}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-[var(--text)]">Domain Ownership Verification</h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          {companyDetails.isVerified 
                            ? "Your domain ownership has been verified successfully." 
                            : "Verify your domain to enable auto-joining for matching employee email domains."}
                        </p>
                      </div>
                    </div>

                    {companyDetails.isVerified ? (
                      <div className="p-4 bg-green-500 bg-opacity-5 border border-green-500 border-opacity-10 rounded-xl text-left">
                        <p className="text-xs font-semibold text-green-500 flex items-center gap-1.5">
                          <span>Verified via {companyDetails.verificationMethod === "dns" ? "DNS TXT Record" : "Email OTP Code"}</span>
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">
                          Any new users registering with the email domain <strong>@{companyDetails.domain}</strong> will be added to this workspace automatically.
                        </p>
                      </div>
                    ) : currentUser?.role !== "ceo" ? (
                      <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-left">
                        <p className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-yellow-500 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                          </svg>
                          Domain verification controls are restricted to the Workspace CEO/Owner.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {!(activeVerification || companyDetails.verificationCode) ? (
                          /* Step 1: Select verification method */
                          <div className="flex flex-col gap-4">
                            <p className="text-xs font-medium text-[var(--text-muted)] text-left">
                              Choose a verification method to start:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                              <label className={`flex flex-col p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                verificationMethod === "otp"
                                  ? "border-[var(--accent)] bg-[var(--accent)] bg-opacity-[0.03]"
                                  : "border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-soft)] hover:bg-[var(--surface)]"
                              }`}>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="verify_method"
                                    value="otp"
                                    checked={verificationMethod === "otp"}
                                    onChange={() => setVerificationMethod("otp")}
                                    className="accent-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--text)]">Email OTP Verification</span>
                                </div>
                                <span className="text-[11px] text-[var(--text-muted)] mt-1.5 pl-5">
                                  Receive a 6-digit verification code in the CEO email inbox (logged in dev terminal).
                                </span>
                              </label>

                              <label className={`flex flex-col p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                verificationMethod === "dns"
                                  ? "border-[var(--accent)] bg-[var(--accent)] bg-opacity-[0.03]"
                                  : "border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-soft)] hover:bg-[var(--surface)]"
                              }`}>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="verify_method"
                                    value="dns"
                                    checked={verificationMethod === "dns"}
                                    onChange={() => setVerificationMethod("dns")}
                                    className="accent-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--text)]">DNS TXT Record</span>
                                </div>
                                <span className="text-[11px] text-[var(--text-muted)] mt-1.5 pl-5">
                                  Verify ownership by adding a custom TXT record to your domain's DNS configurations.
                                </span>
                              </label>
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyDomainStart}
                              disabled={isVerifyingDomain}
                              className="py-2.5 px-4 text-xs font-semibold bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full text-center"
                            >
                              {isVerifyingDomain ? "Generating code..." : "Generate Verification Code"}
                            </button>
                          </div>
                        ) : (
                          /* Step 2: Code verification form */
                          <form onSubmit={handleConfirmDomain} className="flex flex-col gap-4 text-left">
                            <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl flex flex-col gap-2">
                              <p className="text-xs font-bold text-[var(--text)]">
                                Verification Instructions:
                              </p>
                              {((activeVerification?.method || companyDetails.verificationMethod) === "otp") ? (
                                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                  We have sent a 6-digit OTP code to your registered email address. For the local environment, the code has been logged to the backend console.
                                </p>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                    Please add the following TXT record to the DNS host settings for your domain <strong>{companyDetails.domain}</strong>:
                                  </p>
                                  <div className="p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-mono text-[10px] break-all select-all flex items-center justify-between">
                                    <span>{activeVerification?.code || companyDetails.verificationCode}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(activeVerification?.code || companyDetails.verificationCode);
                                        toast.success("TXT token copied!");
                                      }}
                                      className="text-xs px-2 py-0.5 font-sans bg-[var(--bg-soft)] border border-[var(--border)] rounded text-[var(--text)] hover:bg-[var(--border)] active:scale-95 transition shrink-0 ml-2"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="mt-1 p-2.5 bg-yellow-500 bg-opacity-5 border border-yellow-500 border-opacity-10 rounded-lg">
                                <p className="text-[11px] text-yellow-600 font-semibold leading-relaxed">
                                  💡 Recruiter Demo Shortcut:
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-0.5">
                                  Enter <strong>MOCK_VERIFY</strong> in the input below to immediately bypass DNS record validation or backend email lookups.
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-[var(--text)]">
                                Enter Verification Code / Token
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  required
                                  placeholder={
                                    ((activeVerification?.method || companyDetails.verificationMethod) === "otp")
                                      ? "e.g. 123456"
                                      : "e.g. tasksutra-site-verification=..."
                                  }
                                  value={verificationCodeInput}
                                  onChange={(e) => setVerificationCodeInput(e.target.value)}
                                  className="w-full px-3.5 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition duration-150"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={isVerifyingDomain || !verificationCodeInput.trim()}
                                className="flex-1 py-2.5 text-xs font-semibold bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                              >
                                {isVerifyingDomain ? "Verifying..." : "Verify Ownership"}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelVerification}
                                className="px-4 py-2.5 text-xs font-medium border border-[var(--border)] rounded-xl text-[var(--text)] hover:bg-[var(--bg-soft)] transition active:scale-[0.98] cursor-pointer"
                              >
                                Reset / Change Method
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
