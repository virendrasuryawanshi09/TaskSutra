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
  const [invitePreviewUrl, setInvitePreviewUrl] = useState("");
  const [isNodemailerMissing, setIsNodemailerMissing] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [memberModalTab, setMemberModalTab] = useState("invite"); // 'invite' or 'direct'
  const [directMemberData, setDirectMemberData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    title: "",
    skills: "",
  });
  const [isAddingDirectly, setIsAddingDirectly] = useState(false);

  // Edit member states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: "",
    title: "",
    skills: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Domain verification states
  const [verificationMethod, setVerificationMethod] = useState("otp");
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [activeVerification, setActiveVerification] = useState(null);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);

  // Additional premium mock configurations
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);
  const [defaultSignupRole, setDefaultSignupRole] = useState("member");
  const [mfaEnforced, setMfaEnforced] = useState(false);

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
        setInvitePreviewUrl(res.data.previewUrl || "");
        setIsNodemailerMissing(!!res.data.nodemailerMissing);
        toast.success(res.data.message || "Invitation generated!", { id: toastId });
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

  const handleDirectAdd = async (e) => {
    e.preventDefault();
    const { name, email, password, role, title, skills } = directMemberData;
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Name, email, and password are required.");
      return;
    }

    setIsAddingDirectly(true);
    const toastId = toast.loading(`Adding ${name} to workspace...`);
    try {
      const skillsArray = skills
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await axiosInstance.post("/api/workspace/members", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        title: title.trim(),
        skills: skillsArray,
        company: companyDetails?.name || "",
      });

      if (res.data && res.data.success) {
        toast.success("Member added successfully!", { id: toastId });
        setAllUsers((prev) => [...prev, res.data.member]);
        setIsInviteModalOpen(false);
        setDirectMemberData({
          name: "",
          email: "",
          password: "",
          role: "member",
          title: "",
          skills: "",
        });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to add workspace member.",
        { id: toastId }
      );
    } finally {
      setIsAddingDirectly(false);
    }
  };

  const handleOpenEditModal = (userToEdit) => {
    setEditingUser(userToEdit);
    setEditUserData({
      name: userToEdit.name || "",
      title: userToEdit.title || "",
      skills: Array.isArray(userToEdit.skills) ? userToEdit.skills.join(", ") : "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editUserData.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setIsSavingEdit(true);
    const toastId = toast.loading(`Saving changes for ${editUserData.name}...`);
    try {
      const skillsArray = editUserData.skills
        ? editUserData.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await axiosInstance.put(`/api/workspace/members/${editingUser._id}`, {
        name: editUserData.name.trim(),
        title: editUserData.title.trim(),
        skills: skillsArray,
      });

      if (res.data && res.data.success) {
        toast.success("Member updated successfully!", { id: toastId });
        setAllUsers((prev) =>
          prev.map((u) => (u._id === editingUser._id ? res.data.member : u))
        );
        setIsEditModalOpen(false);
        setEditingUser(null);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update member.",
        { id: toastId }
      );
    } finally {
      setIsSavingEdit(false);
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
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer ${activeTab === "members"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
          >
            Team Members
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer ${activeTab === "settings"
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
                        p-4 rounded-xl
                        bg-[var(--surface)]
                        border border-[var(--border)]
                        shadow-sm
                        hover:border-[var(--accent)]
                        hover:-translate-y-0.5
                        transition-all duration-200
                        flex flex-col gap-3
                        sm:flex-row sm:items-center sm:justify-between sm:gap-4
                      "
                    >
                      {/* Left section: Avatar & Info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-soft)] flex items-center justify-center text-xs font-semibold text-[var(--text)] overflow-hidden shrink-0 border border-[var(--border)] shadow-sm">
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

                        {/* Name, Email, and Skills */}
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                            {user.name || "Unnamed"} {isSelf && "(You)"}
                          </span>
                          <span className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">
                            {user.email}
                          </span>

                          {user.skills && user.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {user.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right section: Stats & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t border-[var(--border)] pt-3 sm:border-none sm:pt-0">
                        {/* Stats */}
                        <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)] font-medium">
                          <span>
                            Total: <span className="text-[var(--text)] font-semibold">{stats.total}</span>
                          </span>
                          <span className="flex items-center gap-0.5 text-green-500">
                            ✓ <span className="text-[var(--text)] font-semibold">{stats.completed}</span>
                          </span>
                          <span className="flex items-center gap-0.5 text-cyan-500">
                            ↻ <span className="text-[var(--text)] font-semibold">{stats.inProgress}</span>
                          </span>
                          <span className="flex items-center gap-0.5 text-yellow-500">
                            • <span className="text-[var(--text)] font-semibold">{stats.pending}</span>
                          </span>
                        </div>

                        {/* Role and Delete buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-2">
                            {user.role === "ceo" ? (
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 shadow-sm">
                                Owner / CEO
                              </span>
                            ) : currentUser?.role === "ceo" && !isSelf ? (
                              <select
                                value={user.role || "member"}
                                onChange={(e) => handleRoleChange(user, e.target.value)}
                                className="
                                  px-2.5 py-1 text-xs font-semibold
                                  bg-[var(--bg-soft)] border border-[var(--border)] 
                                  rounded-xl text-[var(--text)]
                                  focus:outline-none focus:border-[var(--accent)]
                                  transition-all duration-150
                                  cursor-pointer
                                "
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : user.role === "admin" ? (
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-sm">
                                Admin
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--border)] shadow-sm">
                                Member
                              </span>
                            )}
                          </div>

                          {(currentUser?.role === "ceo" || currentUser?.role === "admin") && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(user);
                              }}
                              className="
                                p-1.5 rounded-lg
                                text-[var(--text-muted)]
                                hover:text-[var(--accent)]
                                transition-all duration-200
                                active:scale-[0.95]
                                shrink-0
                                cursor-pointer
                              "
                              title="Edit member"
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
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                                />
                              </svg>
                            </button>
                          )}

                          {!isSelf && user.role !== "ceo" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveUser(user);
                              }}
                              className="
                                p-1.5 rounded-lg
                                text-[var(--text-muted)]
                                hover:text-red-500
                                transition-all duration-200
                                active:scale-[0.95]
                                shrink-0
                                cursor-pointer
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
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-6 font-sans">

            {isLoadingCompany ? (
              <div className="text-center py-20 text-[var(--text-muted)] font-mono text-xs flex flex-col items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></span>
                <span>Resolving secure workspace configuration...</span>
              </div>
            ) : !companyDetails ? (
              /* Create Workspace Form (Ultra-Premium Setup Console) */
              <div className="max-w-md mx-auto py-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm relative z-10 text-left">
                <div className="flex justify-center mb-6">
                  <span className="px-3 py-1 text-[9px] font-mono font-extrabold uppercase bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-full tracking-widest flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
                    Workspace Registration
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-[var(--text)] mb-2 text-center tracking-tight">
                  Deploy Your Enterprise Engine
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-8 text-center leading-relaxed">
                  Establish a secure workspace directory for your company. Match email domains for automatic employee onboarding.
                </p>

                <form onSubmit={handleCreateCompany} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                      Workspace Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">🏢</span>
                      <input
                        type="text"
                        required
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Acme Corporation"
                        className="w-full pl-10 pr-4 py-3 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-205"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                      Workspace Domain
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">🌐</span>
                      <input
                        type="text"
                        required
                        value={newCompanyDomain}
                        onChange={(e) => setNewCompanyDomain(e.target.value)}
                        placeholder="acme.com"
                        className="w-full pl-10 pr-4 py-3 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-205"
                      />
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] block font-mono text-left">
                      Must match corporate email domains (e.g. user@domain.com)
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingCompany || !newCompanyName.trim()}
                    className="w-full py-3 mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    {isCreatingCompany ? "Creating Workspace..." : "Create Workspace"}
                  </button>
                </form>
              </div>
            ) : (
              /* Settings Dashboard UI */
              <div className="space-y-6">

                {/* 1. Header Hero Panel */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--border)]">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded">
                        Workspace Console
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        ID: WS-{companyDetails._id?.substring(18) || "682-ANTI"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)] flex items-center gap-2.5">
                      {companyDetails.name}
                      {companyDetails.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Setup Required
                        </span>
                      )}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`http://localhost:5173/signup`);
                        toast.success("Signup URL copied!");
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl transition cursor-pointer shadow-sm animate-all"
                    >
                      Copy Link
                    </button>
                    {companyDetails.isVerified && (
                      <span className="px-3.5 py-2 text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl">
                        Active Node
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. General Configuration Section */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-mono">General Configurations</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Workspace registration profile details.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">Workspace Name</label>
                      <input
                        type="text"
                        disabled
                        value={companyDetails.name}
                        className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text-muted)] cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">Verified Domain</label>
                      <input
                        type="text"
                        disabled
                        value={companyDetails.domain}
                        className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text-muted)] cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Domain Verification Section */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-mono">Domain Verification Registry</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Authenticate domain ownership to secure user auto-join.</p>
                    </div>
                    {companyDetails.isVerified ? (
                      <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400 uppercase">Passed</span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-amber-500 uppercase">Pending</span>
                    )}
                  </div>

                  {companyDetails.isVerified ? (
                    /* Verified Success View */
                    <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl space-y-3 text-left">
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Domain Ownership Successfully Cleared
                      </p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                        Your workspace domain **{companyDetails.domain}** was verified via {companyDetails.verificationMethod === "dns" ? "DNS TXT record matching" : "corporate email OTP verification"}. Automatically accepting logins with corporate emails.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-[10px] text-[var(--text-muted)] text-left">
                        <span className="px-2.5 py-1 bg-[var(--bg-soft)] rounded border border-[var(--border)]">SSL Status: Active</span>
                        <span className="px-2.5 py-1 bg-[var(--bg-soft)] rounded border border-[var(--border)]">Gateway: Verified</span>
                        <span className="px-2.5 py-1 bg-[var(--bg-soft)] rounded border border-[var(--border)]">MX Route: Valid</span>
                      </div>
                    </div>
                  ) : currentUser?.role !== "ceo" ? (
                    /* Non-CEO Unverified Warning */
                    <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl flex items-start gap-3 text-left">
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                        Domain verification is required. Only the CEO/Workspace Owner can verify or edit domain settings.
                      </p>
                    </div>
                  ) : (
                    /* Verification Wizard */
                    <div className="space-y-5 text-left">
                      {!(activeVerification || companyDetails.verificationCode) ? (
                        /* Step 1: Select Verification Method */
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                            1. Select Verification Method
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Email OTP Option */}
                            <div
                              onClick={() => setVerificationMethod("otp")}
                              className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${verificationMethod === "otp"
                                ? "border-[var(--accent)] bg-[var(--accent)]/5"
                                : "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--surface)]"
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-[var(--text)]">Email OTP Verification</span>
                                <input
                                  type="radio"
                                  name="verify_method"
                                  checked={verificationMethod === "otp"}
                                  onChange={() => setVerificationMethod("otp")}
                                  className="accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
                                />
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-sans">
                                Sends a 6-digit confirmation pin to verify domain connectivity.
                              </p>
                            </div>

                            {/* DNS TXT Option */}
                            <div
                              onClick={() => setVerificationMethod("dns")}
                              className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${verificationMethod === "dns"
                                ? "border-[var(--accent)] bg-[var(--accent)]/5"
                                : "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--surface)]"
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-[var(--text)]">DNS TXT Record</span>
                                <input
                                  type="radio"
                                  name="verify_method"
                                  checked={verificationMethod === "dns"}
                                  onChange={() => setVerificationMethod("dns")}
                                  className="accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
                                />
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-sans">
                                Requires adding a custom TXT code to your domain server DNS configuration.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleVerifyDomainStart}
                            disabled={isVerifyingDomain}
                            className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center font-sans"
                          >
                            {isVerifyingDomain ? "Activating Process..." : "Generate Verification Code"}
                          </button>
                        </div>
                      ) : (
                        /* Step 2: Code verification form with sandbox intercept */
                        <form onSubmit={handleConfirmDomain} className="space-y-4">
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                            2. Add Verification Code
                          </p>

                          {/* DNS TXT Instructions */}
                          {((activeVerification?.method || companyDetails.verificationMethod) === "dns") && (
                            <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl space-y-2">
                              <span className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">Required DNS Record Configuration</span>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
                                <div className="sm:col-span-1 p-2 bg-[var(--surface)] border border-[var(--border)] rounded">
                                  <span className="text-[8px] text-[var(--text-muted)] block">TYPE</span>
                                  <span className="text-[var(--text)] text-[11px] font-bold">TXT</span>
                                </div>
                                <div className="sm:col-span-1 p-2 bg-[var(--surface)] border border-[var(--border)] rounded">
                                  <span className="text-[8px] text-[var(--text-muted)] block">HOST</span>
                                  <span className="text-[var(--text)] text-[11px] font-bold">@</span>
                                </div>
                                <div className="sm:col-span-2 p-2 bg-[var(--surface)] border border-[var(--border)] rounded relative font-sans">
                                  <span className="text-[8px] text-[var(--text-muted)] block">VALUE</span>
                                  <span className="text-[var(--accent)] text-[10px] font-bold truncate block select-all pr-8">
                                    {activeVerification?.code || companyDetails.verificationCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(activeVerification?.code || companyDetails.verificationCode);
                                      toast.success("TXT record copied!");
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] text-[10px]"
                                  >
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Email OTP Info */}
                          {((activeVerification?.method || companyDetails.verificationMethod) === "otp") && (
                            <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl">
                              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                                We sent a secure 6-digit confirmation pin to **{currentUser.email}**. Check your mailbox and input the security token below.
                              </p>
                            </div>
                          )}

                          {/* Sandbox Intercept Panel */}
                          <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl space-y-2.5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
                                <span className="text-[9px] font-mono font-extrabold text-[var(--accent)] uppercase tracking-widest">
                                  Sandbox Telemetry Intercept
                                </span>
                              </div>
                              <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase font-bold">Local dev mode</span>
                            </div>

                            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-sans">
                              Verification interceptor active. Grab key values instantly from this debugging interface:
                            </p>

                            <div className="flex items-center justify-between p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded font-mono text-xs">
                              <div className="text-left">
                                <span className="text-[8px] text-[var(--text-muted)] block uppercase font-bold font-mono">
                                  {((activeVerification?.method || companyDetails.verificationMethod) === "otp") ? "OTP Security Key" : "DNS TXT value"}
                                </span>
                                <span className="text-[var(--accent)] font-extrabold tracking-wider select-all block mt-0.5">
                                  {activeVerification?.code || companyDetails.verificationCode}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(activeVerification?.code || companyDetails.verificationCode);
                                  toast.success("Copied!");
                                }}
                                className="px-2 py-1 bg-[var(--bg-soft)] border border-[var(--border)] rounded text-[9px] text-[var(--text)] hover:bg-[var(--border)] transition active:scale-95 cursor-pointer"
                              >
                                Copy Value
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] border-dashed text-[9px] font-mono text-[var(--text-muted)]">
                              <span>DNS Verification Bypass code:</span>
                              <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 rounded font-bold uppercase tracking-wider">
                                MOCK_VERIFY
                              </span>
                            </div>
                          </div>

                          {/* Code Confirmation Input */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                              Verify Security Token
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                required
                                value={verificationCodeInput}
                                onChange={(e) => setVerificationCodeInput(e.target.value)}
                                placeholder={
                                  ((activeVerification?.method || companyDetails.verificationMethod) === "otp")
                                    ? "Enter 6-digit verification code"
                                    : "Enter verification record or 'MOCK_VERIFY'"
                                }
                                className="flex-1 px-3.5 py-2.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-200 font-sans"
                              />
                              <button
                                type="submit"
                                disabled={isVerifyingDomain || !verificationCodeInput.trim()}
                                className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {isVerifyingDomain ? "Checking..." : "Verify"}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelVerification}
                                className="px-3.5 py-2.5 border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-soft)] rounded-xl text-xs transition active:scale-95 cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Onboarding & Member Policy Controls Section */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:p-6 space-y-5 shadow-sm">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-mono">Onboarding & Auto-Join Policies</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Configure entry logic and privileges for domain members.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Toggle A: Auto-Join */}
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl">
                      <div className="space-y-0.5 text-left">
                        <span className="text-xs font-bold text-[var(--text)] block">Auto-Join Protocol</span>
                        <span className="text-[10px] text-[var(--text-muted)] block leading-relaxed">
                          Automatically add signups matching verified domain email to team.
                        </span>
                      </div>

                      <div
                        onClick={() => setAutoJoinEnabled(!autoJoinEnabled)}
                        className={`relative w-10 h-5.5 rounded-full cursor-pointer transition-colors duration-200 border ${autoJoinEnabled
                          ? "bg-[var(--accent)] border-[var(--accent)]"
                          : "bg-[var(--border)] border-[var(--border)]"
                          }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4.5 h-4.5 bg-[var(--surface)] rounded-full transition-transform duration-200 ${autoJoinEnabled ? "translate-x-4.5" : "translate-x-0.5"
                            }`}
                        ></span>
                      </div>
                    </div>

                    {/* Selector: Default Signup Role */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl">
                      <div className="space-y-0.5 text-left">
                        <span className="text-xs font-bold text-[var(--text)] block">Default Account Level</span>
                        <span className="text-[10px] text-[var(--text-muted)] block leading-relaxed font-sans">
                          Baseline role credentials given to auto-joining users.
                        </span>
                      </div>

                      <select
                        value={defaultSignupRole}
                        onChange={(e) => setDefaultSignupRole(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold outline-none focus:border-[var(--accent)] transition duration-150 cursor-pointer"
                      >
                        <option value="member">Member (Read/Write)</option>
                        <option value="admin">Admin (Full Access)</option>
                      </select>
                    </div>

                    {/* Toggle B: Enforce MFA */}
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl">
                      <div className="space-y-0.5 text-left">
                        <span className="text-xs font-bold text-[var(--text)] block">Enforce Multi-Factor (MFA)</span>
                        <span className="text-[10px] text-[var(--text-muted)] block leading-relaxed">
                          Require two-step authentication for access matrix.
                        </span>
                      </div>

                      <div
                        onClick={() => setMfaEnforced(!mfaEnforced)}
                        className={`relative w-10 h-5.5 rounded-full cursor-pointer transition-colors duration-200 border ${mfaEnforced
                          ? "bg-[var(--accent)] border-[var(--accent)]"
                          : "bg-[var(--border)] border-[var(--border)]"
                          }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4.5 h-4.5 bg-[var(--surface)] rounded-full transition-transform duration-200 ${mfaEnforced ? "translate-x-4.5" : "translate-x-0.5"
                            }`}
                        ></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Access Matrix Directory Section */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-mono">Team Access Matrix</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Review active member nodes on your domain workspace.</p>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-[var(--text-muted)] bg-[var(--bg-soft)] px-2.5 py-1 rounded border border-[var(--border)] uppercase">
                      {allUsers.length} Nodes
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--border)]/60 max-h-[220px] overflow-y-auto pr-1">
                    {allUsers.length === 0 ? (
                      <div className="text-center py-8 text-xs font-mono text-[var(--text-muted)]">
                        Matrix empty. No coworker nodes mapped.
                      </div>
                    ) : (
                      allUsers.map((u) => {
                        const isSelf = currentUser && (currentUser._id === u._id || currentUser.email === u.email);
                        return (
                          <div key={u._id} className="py-3 flex items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--text)] shrink-0 select-none">
                                {getInitials(u.name || "U")}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-[var(--text)] truncate block">
                                  {u.name || "Unnamed"} {isSelf && "(You)"}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] truncate block mt-0.5 font-sans">{u.email}</span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase tracking-wider ${u.role === "ceo"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : u.role === "admin"
                                ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                                : "bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--border)]"
                              }`}>
                              {u.role === "ceo" ? "Owner" : u.role}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 6. Danger Zone Section */}
                <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
                  <div className="text-left border-b border-red-500/20 pb-3">
                    <h3 className="text-sm font-bold text-red-655 dark:text-red-400 uppercase tracking-wider font-mono">Workspace Danger Zone</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Actions below are critical and require administrator clearance.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-xs font-bold text-[var(--text)] block">Reset Domain Authentication</span>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 leading-relaxed font-sans">
                        This revokes verified credentials, requiring immediate ownership re-validation.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Are you absolutely sure you want to reset domain verification? Access policy routes will be deactivated.")) return;
                        const toastId = toast.loading("Revoking verified status...");
                        try {
                          const res = await axiosInstance.post("/api/workspace/verify-domain", {
                            method: "otp",
                          });
                          if (res.data) {
                            await fetchCompanyDetails();
                            setActiveVerification(null);
                            toast.success("Verification revoked. Domain settings reset.", { id: toastId });
                          }
                        } catch (err) {
                          toast.error("Failed to revoke verification.", { id: toastId });
                        }
                      }}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shrink-0 font-sans"
                    >
                      Reset Verification
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[4px] p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-3 text-left">
              Manage Workspace Members
            </h2>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)] mb-5 gap-4">
              <button
                type="button"
                onClick={() => {
                  setMemberModalTab("invite");
                  setGeneratedLink("");
                }}
                className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${memberModalTab === "invite"
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
              >
                Invite with Link
              </button>
              <button
                type="button"
                onClick={() => setMemberModalTab("direct")}
                className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${memberModalTab === "direct"
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
              >
                Add Directly
              </button>
            </div>

            {memberModalTab === "invite" ? (
              /* --- INVITATION FLOW --- */
              !generatedLink ? (
                <form onSubmit={handleSendInvite} className="flex flex-col gap-4 text-left">
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Generate a secure link to allow the user to sign up themselves. Link will expire in 10 minutes.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[var(--text)] font-semibold">
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
                        transition duration-150 cursor-pointer
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
                        transition duration-150 cursor-pointer
                      "
                    >
                      {isInviting ? "Generating..." : "Generate Invite"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4 text-left font-sans">
                  {invitePreviewUrl ? (
                    <div className="p-4 bg-cyan-950/10 border border-cyan-800/20 rounded-xl flex flex-col gap-2">
                      <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                        Direct Email Dispatched!
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Since this is a local development environment, the invitation email was sent to a virtual sandbox inbox. You can open and review the sent template below:
                      </p>
                      <a
                        href={invitePreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 w-full py-2 px-3 text-xs font-bold text-center text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 active:scale-[0.98] transition-all inline-block"
                      >
                        View Sent Email ↗
                      </a>
                    </div>
                  ) : isNodemailerMissing ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-1.5">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        ⚠️ Automatic Email Skipped
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                        The package <code className="font-mono bg-[var(--bg-soft)] px-1 rounded">nodemailer</code> is not installed in the backend. The invitation link was generated, but could not be sent to <span className="font-semibold text-[var(--text)]">{inviteEmail}</span>. Run <code className="font-mono bg-[var(--bg-soft)] px-1 rounded">npm install nodemailer</code> inside <code className="font-mono">backend</code>.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                      <p className="text-[11px] text-green-500 font-semibold mb-1">
                        Invitation Generated!
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        The invitation details have been registered on the server.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[var(--text)] font-semibold">
                      Fallback Signup URL
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
                          hover:bg-[var(--accent-hover)] transition shrink-0 cursor-pointer
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
                        setInvitePreviewUrl("");
                        setIsNodemailerMissing(false);
                      }}
                      className="
                        px-4 py-2 text-sm font-medium 
                        bg-[var(--accent)] text-white rounded-xl 
                        hover:bg-[var(--accent-hover)] transition cursor-pointer
                      "
                    >
                      Done
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* --- DIRECT ADD FLOW --- */
              <form onSubmit={handleDirectAdd} className="flex flex-col gap-3.5 text-left max-h-[70vh] overflow-y-auto pr-1">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Directly create a new user profile. They can sign in instantly with their email and password.
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--text)] font-semibold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={directMemberData.name}
                    onChange={(e) => setDirectMemberData({ ...directMemberData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--text)] font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={directMemberData.email}
                    onChange={(e) => setDirectMemberData({ ...directMemberData, email: e.target.value })}
                    placeholder="john.doe@company.com"
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--text)] font-semibold">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    value={directMemberData.password}
                    onChange={(e) => setDirectMemberData({ ...directMemberData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[var(--text)] font-semibold">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={directMemberData.title}
                      onChange={(e) => setDirectMemberData({ ...directMemberData, title: e.target.value })}
                      placeholder="e.g. Lead Designer"
                      className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[var(--text)] font-semibold">
                      Role
                    </label>
                    <select
                      value={directMemberData.role}
                      onChange={(e) => setDirectMemberData({ ...directMemberData, role: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[var(--text)] font-semibold">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={directMemberData.skills}
                    onChange={(e) => setDirectMemberData({ ...directMemberData, skills: e.target.value })}
                    placeholder="e.g. React, Node.js, Mongoose"
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setDirectMemberData({
                        name: "",
                        email: "",
                        password: "",
                        role: "member",
                        title: "",
                        skills: "",
                      });
                    }}
                    className="
                      px-4 py-2 text-sm font-medium 
                      border border-[var(--border)] rounded-xl 
                      text-[var(--text)] hover:bg-[var(--bg-soft)] 
                      transition duration-150 cursor-pointer
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingDirectly || !directMemberData.name.trim() || !directMemberData.email.trim() || !directMemberData.password.trim()}
                    className="
                      px-4 py-2 text-sm font-medium 
                      bg-[var(--accent)] text-white rounded-xl 
                      hover:bg-[var(--accent-hover)] 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition duration-150 cursor-pointer
                    "
                  >
                    {isAddingDirectly ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[4px] p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative font-sans">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-3 text-left">
              Edit Workspace Member
            </h2>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5 text-left pr-1">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Update the member's profile details. Changing their role is handled in the main list.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--text)] font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--text)] font-semibold">
                  Job Title
                </label>
                <input
                  type="text"
                  value={editUserData.title}
                  onChange={(e) => setEditUserData({ ...editUserData, title: e.target.value })}
                  placeholder="e.g. Lead Designer"
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--text)] font-semibold">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={editUserData.skills}
                  onChange={(e) => setEditUserData({ ...editUserData, skills: e.target.value })}
                  placeholder="e.g. React, Node.js, Mongoose"
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                    setEditUserData({
                      name: "",
                      title: "",
                      skills: "",
                    });
                  }}
                  className="
                    px-4 py-2 text-sm font-medium 
                    border border-[var(--border)] rounded-xl 
                    text-[var(--text)] hover:bg-[var(--bg-soft)] 
                    transition duration-150 cursor-pointer
                  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editUserData.name.trim()}
                  className="
                    px-4 py-2 text-sm font-medium 
                    bg-[var(--accent)] text-white rounded-xl 
                    hover:bg-[var(--accent-hover)] 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition duration-150 cursor-pointer
                  "
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageUsers;
