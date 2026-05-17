import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState.js";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import toast from "react-hot-toast";
import ProfileIdentitySection from "./components/ProfileIdentitySection";
import ProfileSidebar from "./components/ProfileSidebar";
import ProfileSaveBar from "./components/ProfileSaveBar";

const EditProfile = () => {
  const { user, updateUser } = useContext(UserContext);

  const [form, setForm] = useState({ name: "", email: "", title: "", company: "", bio: "", skills: [] });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        title: user.title || "",
        company: user.company || "",
        bio: user.bio || "",
        skills: Array.isArray(user.skills) ? user.skills : [],
      });
      setAvatarPreview(user.profileImageUrl || null);
    }
  }, [user]);

  const uploadAvatar = async () => {
    if (!avatarFile) return avatarPreview;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("image", avatarFile);
      const res = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.imageUrl;
    } catch {
      toast.error("Failed to upload image.");
      return avatarPreview;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required.");
    if (password.next && password.next !== password.confirm)
      return toast.error("Passwords do not match.");

    setSaving(true);
    const toastId = toast.loading("Saving changes…");
    try {
      const imageUrl = await uploadAvatar();
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        profileImageUrl: imageUrl,
        title: form.title.trim(),
        company: form.company.trim(),
        bio: form.bio.trim(),
        skills: form.skills,
      };
      if (password.next) payload.password = password.next;

      const res = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, payload);
      updateUser({ ...user, ...res.data });
      setAvatarFile(null);
      setPassword({ next: "", confirm: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
      toast.success("Profile updated.", { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save profile.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      title: user?.title || "",
      company: user?.company || "",
      bio: user?.bio || "",
      skills: Array.isArray(user?.skills) ? user.skills : [],
    });
    setAvatarPreview(user?.profileImageUrl || null);
    setAvatarFile(null);
    setPassword({ next: "", confirm: "" });
  };

  const isBusy = saving || uploadingAvatar;

  return (
    <DashboardLayout activeMenu="Edit Profile">
      <div className="mx-auto w-full max-w-5xl pb-24">

        {/* ── Page Header ─────────────────────────────────── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-7">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text)]">
              Profile Workspace
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">
              Manage your identity, role, and workspace preferences.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--text-muted)] shadow-sm w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {user?.role === "admin" ? "Administrator" : "Team Member"}
          </div>
        </div>

        {/* ── Two-column layout ───────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] items-start">
          <ProfileIdentitySection
            form={form}
            setForm={setForm}
            avatarPreview={avatarPreview}
            setAvatarPreview={setAvatarPreview}
            setAvatarFile={setAvatarFile}
            password={password}
            setPassword={setPassword}
          />
          <div className="lg:sticky lg:top-6">
            <ProfileSidebar form={form} avatarPreview={avatarPreview} user={user} />
          </div>
        </div>
      </div>

      <ProfileSaveBar isBusy={isBusy} saved={saved} user={user} onSave={handleSave} onDiscard={handleDiscard} />
    </DashboardLayout>
  );
};

export default EditProfile;
