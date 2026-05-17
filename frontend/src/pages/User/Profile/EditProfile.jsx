import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState.js";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import toast from "react-hot-toast";
import ProfileWorkspace from "./components/ProfileWorkspace";
import ProfileRail from "./components/ProfileRail";
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
    if (password.next && password.next !== password.confirm) return toast.error("Passwords do not match.");
    setSaving(true);
    const tid = toast.loading("Saving changes…");
    try {
      const imageUrl = await uploadAvatar();
      const payload = {
        name: form.name.trim(), email: form.email.trim(),
        profileImageUrl: imageUrl,
        title: form.title.trim(), company: form.company.trim(),
        bio: form.bio.trim(), skills: form.skills,
      };
      if (password.next) payload.password = password.next;
      const res = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, payload);
      updateUser({ ...user, ...res.data });
      setAvatarFile(null);
      setPassword({ next: "", confirm: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
      toast.success("Profile updated.", { id: tid });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save.", { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm({
      name: user?.name || "", email: user?.email || "",
      title: user?.title || "", company: user?.company || "",
      bio: user?.bio || "", skills: Array.isArray(user?.skills) ? user.skills : [],
    });
    setAvatarPreview(user?.profileImageUrl || null);
    setAvatarFile(null);
    setPassword({ next: "", confirm: "" });
  };

  return (
    <DashboardLayout activeMenu="Edit Profile">
      <div className="pb-24">

        {/* ── Page header ─────────────────────────────── */}
        <div className="mb-8 flex items-end justify-between border-b border-[var(--border)] pb-5">
          <div>
            <p className="text-[10.5px] font-mono font-bold tracking-[0.2em] uppercase text-[var(--accent)]/70 mb-1">
              Workspace · Profile
            </p>
            <h1 className="text-[24px] font-bold tracking-tight text-[var(--text)] leading-none">
              Profile Settings
            </h1>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]/60 hidden sm:block">
            ⌘ S to save
          </span>
        </div>

        {/* ── Two-column workspace ─────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
          {/* Left: editable workspace */}
          <ProfileWorkspace
            form={form} setForm={setForm}
            avatarPreview={avatarPreview}
            setAvatarPreview={setAvatarPreview}
            setAvatarFile={setAvatarFile}
            password={password} setPassword={setPassword}
          />

          {/* Right: identity rail (sticky) */}
          <div className="lg:sticky lg:top-6 self-start">
            <ProfileRail form={form} avatarPreview={avatarPreview} user={user} />
          </div>
        </div>
      </div>

      <ProfileSaveBar
        isBusy={saving || uploadingAvatar}
        saved={saved}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </DashboardLayout>
  );
};

export default EditProfile;
