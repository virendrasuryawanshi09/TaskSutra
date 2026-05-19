import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { downloadReport } from "../../utils/downloadReport";
import { 
  LuFileSpreadsheet, 
  LuSearch, 
  LuUserMinus, 
  LuShieldAlert, 
  LuBriefcase,
  LuSparkles,
  LuCircleCheckBig,
  LuUserPlus,
  LuPlus,
  LuCopy,
  LuEye,
  LuEyeOff
} from "react-icons/lu";
import toast from "react-hot-toast";

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New states for Workspace Member creation and stats
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [workspaceStats, setWorkspaceStats] = useState(null);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    title: "",
    company: "TaskSutra",
    skills: "",
    bio: ""
  });

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.WORKSPACE.GET_ALL_MEMBERS);
      if (response.data && response.data.success) {
        setAllUsers(response.data.members || []);
      } else {
        setAllUsers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load workspace members.");
    }
  };

  const getWorkspaceStats = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.WORKSPACE.GET_STATS);
      if (response.data && response.data.success) {
        setWorkspaceStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching workspace stats:", error);
    }
  };

  useEffect(() => {
    getAllUsers();
    getWorkspaceStats();
  }, []);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewMember(prev => ({ ...prev, password: pwd }));
    toast.success("Secure password generated!");
  };

  const copyPassword = () => {
    if (!newMember.password) return;
    navigator.clipboard.writeText(newMember.password);
    toast.success("Password copied to clipboard!");
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.password) {
      toast.error("Name, email, and password are required.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Adding workspace member...");
    try {
      const skillsArray = newMember.skills
        ? newMember.skills.split(",").map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...newMember,
        skills: skillsArray
      };

      const response = await axiosInstance.post(API_PATHS.WORKSPACE.ADD_MEMBER, payload);

      if (response.data.success) {
        toast.success("Member successfully added to workspace!", { id: toastId });
        setIsAddModalOpen(false);
        setNewMember({
          name: "",
          email: "",
          password: "",
          role: "member",
          title: "",
          company: "TaskSutra",
          skills: "",
          bio: ""
        });
        getAllUsers();
        getWorkspaceStats();
      } else {
        throw new Error(response.data.message || "Failed to add member");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to add workspace member.",
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        error?.message || "Failed to download users report.",
        { id: toastId }
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    const toastId = toast.loading(`Revoking workspace access for ${deletingUser.name}...`);

    try {
      const response = await axiosInstance.delete(`/api/workspace/members/${deletingUser._id}`);
      if (response.data.success) {
        toast.success(`${deletingUser.name} successfully removed from the workspace. All tasks and chats cleaned up.`, { id: toastId });
        setAllUsers(prev => prev.filter(u => u._id !== deletingUser._id));
        setDeletingUser(null);
      } else {
        throw new Error(response.data.message || "Failed to remove member");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to revoke member access.",
        { id: toastId }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  };

  // Filtered Users computation
  const filteredUsers = allUsers.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      u.name?.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query) ||
      u.title?.toLowerCase().includes(query) ||
      (u.skills && u.skills.some(s => s.toLowerCase().includes(query)));
    
    if (selectedRoleFilter === "all") return matchesSearch;
    return matchesSearch && u.role === selectedRoleFilter;
  });

  // Calculate workspace stats
  const totalTasksAssigned = allUsers.reduce((acc, u) => acc + (u.totalTasks || 0), 0);
  const completedTasksCount = allUsers.reduce((acc, u) => acc + (u.completedTasks || 0), 0);

  return (
    <DashboardLayout activeMenu="manage-users">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-left">
        
        {/* Sleek Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-bold tracking-widest uppercase rounded border border-[var(--accent)]/10">
                Workspace scope
              </span>
            </div>
            <h1 className="text-[24px] font-black tracking-tight text-[var(--text)] mt-1">
              Workspace Members
            </h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Manage corporate membership, revoke access, and review team task capacity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportUsersReport}
              disabled={isExporting}
              className="
                flex items-center gap-2
                px-4 py-2.5 text-xs font-semibold
                rounded-xl
                bg-[var(--surface)]
                border border-[var(--border)]
                text-[var(--text)]
                shadow-sm
                hover:bg-[var(--bg-soft)]
                disabled:opacity-50
                active:scale-[0.98]
                transition-all duration-200
                cursor-pointer
              "
            >
              <LuFileSpreadsheet className="text-sm" />
              {isExporting ? "Exporting..." : "Export Directory"}
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="
                flex items-center gap-2
                px-4 py-2.5 text-xs font-bold
                rounded-xl
                bg-[var(--accent)]
                text-white
                shadow-sm
                hover:bg-[var(--accent-hover)]
                active:scale-[0.98]
                transition-all duration-200
                cursor-pointer
              "
            >
              <LuUserPlus className="text-sm" />
              Add Member
            </button>
          </div>
        </div>

        {/* Premium Core Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm relative overflow-hidden group">
            <div className="absolute right-3 top-3 opacity-5 text-4xl group-hover:scale-110 transition-transform"><LuSparkles /></div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Workspace Members</p>
            <h3 className="text-3xl font-black mt-2 text-[var(--text)]">
              {workspaceStats ? workspaceStats.totalWorkspaceUsers : allUsers.length}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              {workspaceStats ? `${workspaceStats.totalAdmins} Admins • ${workspaceStats.totalMembers} Members` : "Fully credentialed profiles"}
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm relative overflow-hidden group">
            <div className="absolute right-3 top-3 opacity-5 text-4xl group-hover:scale-110 transition-transform"><LuBriefcase /></div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Task Allocations</p>
            <h3 className="text-3xl font-black mt-2 text-[var(--text)]">
              {workspaceStats ? workspaceStats.totalTasks : totalTasksAssigned}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              {workspaceStats ? `${workspaceStats.inProgressTasks} In Progress • ${workspaceStats.pendingTasks} Pending` : "Assigned workspace objectives"}
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm relative overflow-hidden group">
            <div className="absolute right-3 top-3 opacity-5 text-4xl group-hover:scale-110 transition-transform"><LuCircleCheckBig /></div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Team Completed Tasks</p>
            <h3 className="text-3xl font-black mt-2 text-[var(--text)]">
              {workspaceStats ? workspaceStats.completedTasks : completedTasksCount}
            </h3>
            <p className="text-[11px] text-green-500 font-semibold mt-1">
              {workspaceStats ? `✓ ${workspaceStats.completionRate}% Workspace Completion Rate` : "✓ Velocity tracking online"}
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[16px]" />
            <input
              type="text"
              placeholder="Search members by name, email, title or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none py-1">
            {["all", "member", "admin"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize border transition-all cursor-pointer ${
                  selectedRoleFilter === role
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30 font-bold"
                    : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]"
                }`}
              >
                {role === "all" ? "All Roles" : `${role}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Premium Member Identity Grid */}
        <AnimatePresence mode="popLayout">
          {filteredUsers.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--bg-soft)] flex items-center justify-center mx-auto mb-3">
                <LuSearch className="text-[20px] text-[var(--text-muted)]" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text)]">No Workspace Members Found</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Try adjusting your search filters or clear the active query.</p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredUsers.map((user) => {
                const isSelf = false; // We will check if it's the current user dynamically
                
                return (
                  <motion.div
                    key={user._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="
                      group flex flex-col justify-between
                      p-5 rounded-xl
                      bg-[var(--surface)]
                      border border-[var(--border)]
                      shadow-sm
                      hover:border-[var(--accent)]
                      hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]
                      transition-all duration-300
                      relative
                    "
                  >
                    
                    {/* Header: Identity & Role Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="
                              w-12 h-12 rounded-lg
                              bg-[var(--bg-soft)]
                              flex items-center justify-center
                              text-[14px] font-bold text-[var(--accent)]
                              border border-[var(--border)]
                              overflow-hidden shrink-0 shadow-sm
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

                          <div className="flex flex-col text-left">
                            <span className="text-[14px] font-extrabold text-[var(--text)] tracking-tight">
                              {user.name || "Unnamed colleague"}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 font-medium">
                              <LuBriefcase className="text-[12px] shrink-0" />
                              {user.title || "Workspace Participant"}
                            </span>
                          </div>
                        </div>

                        {/* Premium role label */}
                        <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-extrabold tracking-widest uppercase border shrink-0 ${
                          user.role === "admin" 
                            ? "bg-[#C28B2C]/10 text-[#C28B2C] border-[#C28B2C]/20 shadow-[0_0_6px_rgba(194,139,44,0.1)]"
                            : "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/20"
                        }`}>
                          {user.role}
                        </span>
                      </div>

                      {/* Bio Description */}
                      <p className="text-[12px] text-[var(--text-muted)] line-clamp-2 mt-4 text-left leading-relaxed">
                        {user.bio || "No professional profile bio provided. Collaborating efficiently in default corporate channels."}
                      </p>

                      {/* Skill Tags */}
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-4">
                          {user.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider transition-colors hover:border-[var(--text-muted)]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom: Task Stats Summary & Deactivate Button */}
                    <div className="mt-6 pt-4 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-4">
                        <div className="flex items-center gap-1 font-semibold">
                          <span>Tasks: {user.totalTasks || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓ {user.completedTasks || 0}</span>
                          <span className="text-cyan-500">↻ {user.inProgressTasks || 0}</span>
                          <span className="text-yellow-500">• {user.pendingTasks || 0}</span>
                        </div>
                      </div>

                      {user.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => setDeletingUser(user)}
                          className="
                            w-full flex items-center justify-center gap-2
                            py-2 text-[11px] font-bold
                            rounded-lg
                            bg-[rgba(239,68,68,0.06)]
                            text-red-500
                            border border-red-500/10
                            hover:bg-red-500 hover:text-white hover:border-red-500
                            transition-all duration-200
                            cursor-pointer
                          "
                        >
                          <LuUserMinus className="text-sm shrink-0" />
                          Revoke Workspace Access
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revoke Workspace Access Warning Modal */}
        <AnimatePresence>
          {deletingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              
              {/* Dark Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isDeleting && setDeletingUser(null)}
                className="absolute inset-0 bg-black/45 backdrop-blur-sm"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0 text-red-500 text-lg">
                    <LuShieldAlert />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                      Revoke Workspace Access?
                    </h3>
                    <p className="text-[12px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                      You are about to remove <span className="font-bold text-[var(--text)]">@{deletingUser.name}</span> ({deletingUser.email}) from this corporate workspace. 
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl p-4 mt-4 space-y-2.5 text-xs text-[var(--text-muted)]">
                  <div className="flex gap-2 items-start">
                    <span className="text-red-500 font-bold shrink-0">•</span>
                    <span>All assigned tasks will be detached from this member immediately.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-red-500 font-bold shrink-0">•</span>
                    <span>All task discussions and community chat messages sent by this member will be permanently deleted.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-red-500 font-bold shrink-0">•</span>
                    <span>Private direct message channels involving this member will be permanently purged to ensure tenant privacy.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-red-500 font-bold shrink-0">•</span>
                    <span>Their login credentials and active session tokens will be revoked immediately.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 justify-end">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setDeletingUser(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-transparent hover:bg-[var(--bg-soft)] text-[var(--text-muted)] hover:text-[var(--text)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleRemoveMember}
                    className="
                      flex items-center gap-1.5
                      px-4 py-2 rounded-lg text-xs font-bold
                      bg-red-500 text-white
                      hover:bg-red-600 active:scale-[0.98]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-all
                    "
                  >
                    {isDeleting ? "Revoking..." : "Confirm Revocation"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Workspace Member Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
              {/* Dark Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSubmitting && setIsAddModalOpen(false)}
                className="fixed inset-0 bg-black/45 backdrop-blur-sm"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative z-10 text-left my-auto"
              >
                <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] text-lg">
                    <LuUserPlus />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                      Add Workspace Member
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Provision a new user account with role-based permissions immediately.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  {/* Basic Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e. Sarah Jenkins"
                        value={newMember.name}
                        onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="sarah.jenkins@company.com"
                        value={newMember.email}
                        onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Password block with generate option */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Credential Password *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••••••"
                          value={newMember.password}
                          onChange={e => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl pl-3 pr-10 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] text-xs cursor-pointer"
                        >
                          {showPassword ? <LuEyeOff /> : <LuEye />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-3 py-2 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition cursor-pointer shrink-0"
                      >
                        Auto-Gen
                      </button>

                      {newMember.password && (
                        <button
                          type="button"
                          onClick={copyPassword}
                          className="px-2.5 py-2 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--border)] transition cursor-pointer shrink-0"
                          title="Copy Password"
                        >
                          <LuCopy />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role & Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Workspace Role *
                      </label>
                      <select
                        value={newMember.role}
                        onChange={e => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
                      >
                        <option value="member">Workspace Member</option>
                        <option value="admin">Workspace Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lead Frontend Architect"
                        value={newMember.title}
                        onChange={e => setNewMember(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Skills input */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Expertise Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="React, CSS, Node.js, AI Integration"
                      value={newMember.skills}
                      onChange={e => setNewMember(prev => ({ ...prev, skills: e.target.value }))}
                      className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Professional Bio
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Describe their experience, responsibilities, or department..."
                      value={newMember.bio}
                      onChange={e => setNewMember(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none transition-all"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 justify-end border-t border-[var(--border)]">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-transparent hover:bg-[var(--bg-soft)] text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="
                        flex items-center gap-1.5
                        px-4 py-2 rounded-xl text-xs font-bold
                        bg-[var(--accent)] text-white
                        hover:bg-[var(--accent-hover)] active:scale-[0.98]
                        disabled:opacity-60 disabled:cursor-not-allowed
                        transition-all cursor-pointer
                      "
                    >
                      {isSubmitting ? "Adding..." : "Add Member"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
