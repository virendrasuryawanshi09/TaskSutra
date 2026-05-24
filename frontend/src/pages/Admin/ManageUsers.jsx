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
              /* Company Info Card (Premium Workspace Layout) */
              <div className="space-y-6">
                {/* Header Profile Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-6 gap-4">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Enterprise Console</span>
                    <h3 className="text-xl font-bold text-[var(--text)] mt-1">
                      {companyDetails.name} Workspace
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Manage organization domains, security validations, and employee access.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Workspace Status:</span>
                    {companyDetails.isVerified ? (
                      <span className="px-3 py-1 text-xs font-bold rounded-xl bg-green-500/10 text-green-500 border border-green-500/25 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Verified Domain
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Verification Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                  {/* Left Column: Organization Details (5/12 cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="p-6 bg-gradient-to-b from-[var(--surface)] to-[var(--bg-soft)] border border-[var(--border)] rounded-2xl shadow-md flex flex-col gap-5">
                      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase">Workspace Specifications</span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Domain Card */}
                        <div className="flex items-start gap-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl transition-all duration-300 hover:shadow-md hover:border-[var(--accent)] group">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-semibold shrink-0 group-hover:scale-105 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Organization Domain</span>
                              <span className="px-1.5 py-0.5 text-[8px] font-bold bg-teal-500/10 text-teal-600 rounded border border-teal-500/20">Primary</span>
                            </div>
                            <p className="text-xs font-extrabold mt-1 text-[var(--text)] uppercase tracking-wide truncate">{companyDetails.domain}</p>
                          </div>
                        </div>

                        {/* Owner Card */}
                        <div className="flex items-start gap-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl transition-all duration-300 hover:shadow-md hover:border-amber-500/50 group">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold shrink-0 group-hover:scale-105 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Workspace Owner</span>
                              <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-500/10 text-amber-600 rounded border border-amber-500/20">Super Admin</span>
                            </div>
                            <p className="text-xs font-bold mt-1 text-[var(--text)] truncate">
                              {currentUser?.role === "ceo" ? "You (CEO / Owner)" : "Workspace Owner"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Security Tip Card */}
                    <div className="p-5 bg-[var(--surface)] border-l-4 border-l-[var(--accent)] border-[var(--border)] rounded-r-2xl shadow-sm flex items-start gap-4 transition-all duration-300 hover:shadow-md">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-soft)] flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h5 className="text-xs font-bold text-[var(--text)] tracking-wide">Domain Security Advisory</h5>
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1">
                          Verifying domain ownership locks down registration access. Team signups matching the workspace domain will instantly auto-join your company without requiring manual invite links.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Verification Panel (7/12 cols) */}
                  <div className="lg:col-span-7">
                    <div className="p-6 border border-[var(--border)] bg-[var(--surface)] rounded-2xl flex flex-col gap-6 shadow-md relative overflow-hidden">
                      <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm shrink-0 ${
                          companyDetails.isVerified 
                            ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                            : "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                        }`}>
                          {companyDetails.isVerified ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-bold text-[var(--text)]">Security Verification Control</h4>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                            {companyDetails.isVerified 
                              ? "Your domain has been securely validated. Access is locked down and active." 
                              : "Verify domain ownership to manage auto-joining protocols."}
                          </p>
                        </div>
                      </div>

                      {companyDetails.isVerified ? (
                        <div className="p-5 bg-gradient-to-r from-green-500/5 to-teal-500/5 border border-green-500/20 rounded-xl text-left space-y-4 shadow-sm">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-green-500/10">
                            <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                              Verified Domain Access Active
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Method</span>
                              <span className="font-bold text-[var(--text)] mt-0.5 block">
                                {companyDetails.verificationMethod === "dns" ? "DNS TXT Registry" : "Secure Email OTP"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Auto-Join Rule</span>
                              <span className="font-bold text-teal-600 mt-0.5 block">Enabled</span>
                            </div>
                          </div>
                          
                          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-2 border-t border-[var(--border)] border-dashed">
                            Employees registering with emails ending in <strong className="text-[var(--text)]">@{companyDetails.domain}</strong> will auto-join this workspace.
                          </p>
                        </div>
                      ) : currentUser?.role !== "ceo" ? (
                        <div className="p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-left flex items-start gap-2.5">
                          <span className="text-yellow-500 mt-0.5">⚠️</span>
                          <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
                            Domain ownership verification is restricted. Only the CEO/Workspace Owner account can initiate validation sequences.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-5">
                          {!(activeVerification || companyDetails.verificationCode) ? (
                            /* Step 1: Select verification method cards */
                            <div className="flex flex-col gap-5">
                              <p className="text-xs font-bold text-[var(--text)] text-left">
                                Select Verification Protocol:
                              </p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Email Card */}
                                <div 
                                  onClick={() => setVerificationMethod("otp")}
                                  className={`flex flex-col p-4.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                                    verificationMethod === "otp"
                                      ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-md scale-[1.02]"
                                      : "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--bg-soft)] hover:scale-[1.01]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text)]">Email OTP Verification</span>
                                    <input
                                      type="radio"
                                      name="verify_method"
                                      value="otp"
                                      checked={verificationMethod === "otp"}
                                      onChange={() => setVerificationMethod("otp")}
                                      className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                                    />
                                  </div>
                                  <span className="text-[10px] text-[var(--text-muted)] mt-3 leading-relaxed">
                                    Receive a secure 6-digit OTP verification code. Bypassed in dev using inline Sandbox console below.
                                  </span>
                                </div>

                                {/* DNS Card */}
                                <div 
                                  onClick={() => setVerificationMethod("dns")}
                                  className={`flex flex-col p-4.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                                    verificationMethod === "dns"
                                      ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-md scale-[1.02]"
                                      : "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--bg-soft)] hover:scale-[1.01]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text)]">DNS TXT Record</span>
                                    <input
                                      type="radio"
                                      name="verify_method"
                                      value="dns"
                                      checked={verificationMethod === "dns"}
                                      onChange={() => setVerificationMethod("dns")}
                                      className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                                    />
                                  </div>
                                  <span className="text-[10px] text-[var(--text-muted)] mt-3 leading-relaxed">
                                    Publish a secure validation TXT token in your domain's DNS registry configurations.
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleVerifyDomainStart}
                                disabled={isVerifyingDomain}
                                className="py-3 px-4 text-xs font-bold bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full text-center shadow-md shadow-[rgba(0,0,0,0.1)]"
                              >
                                {isVerifyingDomain ? "Processing Protocol..." : "Generate Verification Code"}
                              </button>
                            </div>
                          ) : (
                            /* Step 2: Code verification form */
                            <form onSubmit={handleConfirmDomain} className="flex flex-col gap-4 text-left font-sans">
                              
                              {/* DEVSANDBOX INTERCEPT NOTIFICATION PANEL */}
                              <div className="p-4.5 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col gap-3 shadow-lg">
                                <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                  <h5 className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    DEV-SANDBOX-INTERCEPT
                                  </h5>
                                </div>
                                <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                                  System intercepted the security code. In production, this dispatches via email server. For local testing, copy the value below:
                                </p>

                                <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                                  <div className="min-w-0">
                                    <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                                      {((activeVerification?.method || companyDetails.verificationMethod) === "otp") ? "OTP Code" : "TXT TOKEN"}
                                    </span>
                                    <span className="font-mono text-xs font-extrabold text-cyan-300 tracking-wider break-all select-all block mt-0.5">
                                      {activeVerification?.code || companyDetails.verificationCode}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const codeToCopy = activeVerification?.code || companyDetails.verificationCode;
                                      navigator.clipboard.writeText(codeToCopy);
                                      toast.success("Copied to clipboard!");
                                    }}
                                    className="text-[9px] px-2.5 py-1 font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-300 hover:bg-neutral-800 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                                  >
                                    Copy
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-neutral-800 border-dashed justify-between">
                                  <span className="text-[9px] text-neutral-500 font-mono">Bypass key:</span>
                                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 select-all">
                                    MOCK_VERIFY
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 mt-2">
                                <label className="text-xs font-bold text-[var(--text)]">
                                  Enter Verification Code
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder={
                                    ((activeVerification?.method || companyDetails.verificationMethod) === "otp")
                                      ? "Enter intercepted 6-digit OTP code"
                                      : "Enter verification TXT value"
                                  }
                                  value={verificationCodeInput}
                                  onChange={(e) => setVerificationCodeInput(e.target.value)}
                                  className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition duration-150"
                                />
                              </div>

                              <div className="flex items-center gap-3 mt-1.5">
                                <button
                                  type="submit"
                                  disabled={isVerifyingDomain || !verificationCodeInput.trim()}
                                  className="flex-1 py-2.5 text-xs font-bold bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center shadow-md shadow-[rgba(0,0,0,0.1)]"
                                >
                                  {isVerifyingDomain ? "Verifying..." : "Verify Ownership"}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelVerification}
                                  className="px-4 py-2.5 text-xs font-medium border border-[var(--border)] rounded-xl text-[var(--text)] hover:bg-[var(--bg-soft)] transition active:scale-[0.98] cursor-pointer"
                                >
                                  Reset
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
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
                className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  memberModalTab === "invite"
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                Invite with Link
              </button>
              <button
                type="button"
                onClick={() => setMemberModalTab("direct")}
                className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  memberModalTab === "direct"
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
