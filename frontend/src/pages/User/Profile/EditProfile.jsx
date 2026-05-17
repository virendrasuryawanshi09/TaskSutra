import { useContext, useEffect, useRef, useState, useCallback } from "react";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState.js";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import toast from "react-hot-toast";
import { LuLoader, LuCheck } from "react-icons/lu";
import ProfileWorkspace from "./components/ProfileWorkspace";
import ProfileRail from "./components/ProfileRail";

const EditProfile = () => {
  const { user, updateUser } = useContext(UserContext);

  const blank = useCallback(() => ({
    name: user?.name || "",
    title: user?.title || "",
    company: user?.company || "",
    bio: user?.bio || "",
    skills: Array.isArray(user?.skills) ? user.skills : [],
  }), [user]);

  const [form, setForm] = useState(blank);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const justSavedRef = useRef(false); // prevents user-effect from overwriting avatarPreview post-save

  useEffect(() => {
    if (user) {
      setForm(blank());
      if (!justSavedRef.current) {
        // Only reset avatar preview on initial load / context change, not right after save
        setAvatarPreview(user.profileImageUrl ?? null);
      }
      justSavedRef.current = false;
      setAvatarRemoved(false);
    }
  }, [user]);

  // Track dirty state
  useEffect(() => {
    if (!user) return;
    const changed =
      form.name !== (user.name || "") ||
      form.title !== (user.title || "") ||
      form.company !== (user.company || "") ||
      form.bio !== (user.bio || "") ||
      JSON.stringify(form.skills) !== JSON.stringify(Array.isArray(user.skills) ? user.skills : []) ||
      avatarFile !== null ||
      avatarRemoved ||
      password.next !== "";
    setDirty(changed);
  }, [form, avatarFile, avatarRemoved, password.next]);

  const uploadAvatar = async () => {
    if (!avatarFile) return avatarPreview;
    setUploading(true);
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
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required.");
    if (password.next && password.next !== password.confirm) return toast.error("Passwords do not match.");
    setSaving(true);
    const tid = toast.loading("Saving…");
    try {
      const imageUrl = avatarRemoved ? null : await uploadAvatar();
      const payload = {
        name: form.name.trim(),
        profileImageUrl: imageUrl,
        title: form.title.trim(),
        company: form.company.trim(),
        bio: form.bio.trim(),
        skills: form.skills,
      };
      if (password.next) payload.password = password.next;
      const res = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, payload);
      const updatedUser = { ...user, ...res.data };
      justSavedRef.current = true; // skip avatar reset in useEffect
      updateUser(updatedUser);
      // Explicitly sync avatar preview from server response
      setAvatarPreview(res.data.profileImageUrl ?? null);
      setAvatarFile(null);
      setAvatarRemoved(false);
      setPassword({ next: "", confirm: "" });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Saved.", { id: tid });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save.", { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm(blank());
    setAvatarPreview(user?.profileImageUrl || null);
    setAvatarFile(null);
    setAvatarRemoved(false);
    setPassword({ next: "", confirm: "" });
    setDirty(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarRemoved(true);
  };

  const isBusy = saving || uploading;

  return (
    <DashboardLayout activeMenu="Edit Profile">
      <div className="pb-16">

        {/* ── Page Header ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7 border-b border-[var(--border)] pb-5">
          <div>
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[var(--accent)]/60 mb-1">
              Workspace · Profile
            </p>
            <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[var(--text)] leading-none">
              Profile Settings
            </h1>
          </div>

          {/* ── Contextual Save UI ─────────────────────── */}
          <div className={`flex items-center gap-3 transition-all duration-300 ${dirty || saved ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {/* Dirty indicator */}
            {dirty && !saved && (
              <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Unsaved changes</span>
              </div>
            )}

            {/* Revert */}
            {dirty && !isBusy && (
              <button
                onClick={handleDiscard}
                className="text-[12.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors underline underline-offset-2 decoration-[var(--border)]"
              >
                Revert
              </button>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isBusy || (!dirty && !saved)}
              className={`relative flex items-center gap-2 text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed
                ${saved
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm hover:shadow-md disabled:opacity-50"
                }`}
            >
              {isBusy
                ? <LuLoader className="text-sm animate-spin" />
                : saved
                ? <LuCheck className="text-sm" />
                : null
              }
              {isBusy ? "Saving…" : saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* ── Body: Rail (mobile top) + Workspace ──────── */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_260px]">

          {/* Rail shown above workspace on mobile */}
          <div className="lg:hidden">
            <ProfileRail form={{ ...form, email: user?.email }} avatarPreview={avatarPreview} user={user} />
          </div>

          {/* Main editable workspace */}
          <ProfileWorkspace
            form={form} setForm={setForm}
            email={user?.email || ""}
            avatarPreview={avatarPreview}
            setAvatarPreview={setAvatarPreview}
            setAvatarFile={setAvatarFile}
            password={password} setPassword={setPassword}
            onRemoveAvatar={handleRemoveAvatar}
          />

          {/* Rail on right for desktop */}
          <div className="hidden lg:block lg:sticky lg:top-6 self-start">
            <ProfileRail form={{ ...form, email: user?.email }} avatarPreview={avatarPreview} user={user} />
          </div>
        </div>

        {/* ── Mobile sticky save ────────────────────────── */}
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${dirty ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center justify-between gap-3 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDiscard} disabled={isBusy}
                className="text-[12px] font-medium text-[var(--text-muted)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-soft)] transition-colors">
                Revert
              </button>
              <button onClick={handleSave} disabled={isBusy}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[var(--accent)] px-4 py-1.5 rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
                {isBusy ? <LuLoader className="text-sm animate-spin" /> : <LuCheck className="text-sm" />}
                {isBusy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default EditProfile;
