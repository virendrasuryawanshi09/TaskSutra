import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import InviteModal from "../../components/Admin/InviteModal";
import DomainSettingsForm from "../../components/Admin/DomainSettingsForm";
import MemberRowItem from "../../components/Admin/MemberRowItem";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { downloadReport } from "../../utils/downloadReport";
import { LuFileSpreadsheet, LuUserPlus } from "react-icons/lu";
import toast from "react-hot-toast";
import useUserAuth from "../../hooks/useUserAuth.jsx";
import { Helmet } from "react-helmet-async";

const ManageUsers = () => {
  const { user: currentUser, updateUser } = useUserAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // Tabs and Company details
  const [activeTab, setActiveTab] = useState("members");
  const [companyDetails, setCompanyDetails] = useState(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // Invite states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Edit member states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: "",
    title: "",
    skills: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  useEffect(() => {
    getAllUsers();
    fetchCompanyDetails();
  }, []);

  const handleCompanyCreated = (newCompany, newUserContext) => {
    setCompanyDetails(newCompany);
    if (newUserContext) {
      updateUser({
        ...currentUser,
        role: newUserContext.role,
        companyId: newUserContext.companyId,
        company: newUserContext.company,
      });
    }
  };

  const handleExportUsersReport = async () => {
    try {
      setIsExporting(true);
      await downloadReport({
        url: API_PATHS.REPORTS.EXPORT_USERS,
        fallbackFileName: "user_report.xlsx",
      });
    } catch (error) {
      console.error("Failed to download users report:", error);
    } finally {
      setIsExporting(false);
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
      { total: 0, completed: 0, inProgress: 0, pending: 0 }
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
    <>
      <Helmet>
        <title>Manage Team | TaskSutra</title>
        <meta name="description" content="View, invite, edit, or remove workspace members. Configure workspace domain permissions and track team tasks." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <DashboardLayout activeMenu="manage-users">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab Switcher */}
        {companyDetails && (
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
            {(currentUser?.role === "ceo" || currentUser?.role === "admin") && (
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
            )}
          </div>
        )}

        {!companyDetails ? (
          <DomainSettingsForm
            companyDetails={companyDetails}
            currentUser={currentUser}
            onCompanyCreated={handleCompanyCreated}
            onFetchCompanyDetails={fetchCompanyDetails}
            isLoadingCompany={isLoadingCompany}
          />
        ) : activeTab === "members" ? (
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

              {(currentUser?.role === "ceo" || currentUser?.role === "admin") && (
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
              )}
            </div>

            <div className="flex flex-col gap-3">
              {allUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--text-muted)]">
                  No users found
                </div>
              ) : (
                allUsers.map((user) => (
                  <MemberRowItem
                    key={user._id}
                    user={user}
                    currentUser={currentUser}
                    onRoleChange={handleRoleChange}
                    onOpenEdit={handleOpenEditModal}
                    onRemove={handleRemoveUser}
                    getInitials={getInitials}
                    getTaskStats={getTaskStats}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <DomainSettingsForm
            companyDetails={companyDetails}
            currentUser={currentUser}
            onCompanyCreated={handleCompanyCreated}
            onFetchCompanyDetails={fetchCompanyDetails}
            isLoadingCompany={isLoadingCompany}
          />
        )}
      </div>

      {/* Invite/Add Member Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        companyDetails={companyDetails}
        currentUser={currentUser}
        onMemberAdded={(newMember) => setAllUsers((prev) => [...prev, newMember])}
      />

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
                    setEditUserData({ name: "", title: "", skills: "" });
                  }}
                  className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-xl text-[var(--text)] hover:bg-[var(--bg-soft)] transition duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editUserData.name.trim()}
                  className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 cursor-pointer"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
    </>
  );
};

export default ManageUsers;
