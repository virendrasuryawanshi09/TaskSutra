import React, { useContext, useEffect, useRef, useState } from "react";
import {
  LuCamera,
  LuCheck,
  LuChevronRight,
  LuLoader,
  LuLock,
  LuMail,
  LuPencil,
  LuShield,
  LuUser,
  LuX,
  LuBuilding2,
  LuBriefcase,
  LuBadgeCheck,
} from "react-icons/lu";
import { HiOutlineSparkles } from "react-icons/hi";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState.js";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import toast from "react-hot-toast";

const SkillTagInput = ({ skills, onChange }) => {
  const [input, setInput] = useState("");

  const addSkill = (val) => {
    const trimmed = val.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(input);
    }
    if (e.key === "Backspace" && !input && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 transition-all focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]">
      {skills.map((skill) => (
        <span
          key={skill}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--text)] shadow-sm"
        >
          {skill}
          <button
            type="button"
            onClick={() => onChange(skills.filter((s) => s !== skill))}
            className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            <LuX className="text-[10px]" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addSkill(input)}
        placeholder={skills.length === 0 ? "Type a skill and press Enter…" : "Add more…"}
        className="flex-1 min-w-[120px] bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
      />
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </label>
      {hint && <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>}
    </div>
    {children}
  </div>
);


const StyledInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[15px]" />
    )}
    <input
      {...props}
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] py-2.5 text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] ${Icon ? "pl-9 pr-4" : "px-4"} ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    />
  </div>
);


const StyledTextarea = (props) => (
  <textarea
    {...props}
    rows={3}
    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2.5 text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none resize-none transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
  />
);


const AIFeatureCard = ({ label, description, badge }) => (
  <div className="group relative flex items-start gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--accent)] hover:shadow-sm cursor-default overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
    <div className="relative shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--accent)]">
      <HiOutlineSparkles className="text-[14px]" />
    </div>
    <div className="relative min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="text-[13px] font-semibold text-[var(--text)]">{label}</p>
        {badge && (
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[12px] text-[var(--text-muted)] leading-5">{description}</p>
    </div>
    <LuChevronRight className="relative shrink-0 text-[var(--text-muted)] text-sm opacity-40 group-hover:opacity-80 transition-opacity mt-0.5" />
  </div>
);

// ── Section Heading ──────────────────────────────────────────────────────────
const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-5 pb-4 border-b border-[var(--border)]">
    <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">{title}</h2>
    {subtitle && <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">{subtitle}</p>}
  </div>
);

// ── Main Page ────────────────────────────────────────────────────────────────
const EditProfile = () => {
  const { user, updateUser } = useContext(UserContext);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    company: "",
    bio: "",
    skills: [],
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed from context
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

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

    if (password.next && password.next !== password.confirm) {
      return toast.error("New passwords do not match.");
    }

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

      // Persist updated user to context/localStorage
      updateUser({
        ...user,
        ...res.data,
      });

      setAvatarFile(null);
      setPassword({ current: "", next: "", confirm: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
      toast.success("Profile updated successfully.", { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save profile.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const userInitial = form.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const isBusy = saving || uploadingAvatar;

  return (
    <DashboardLayout activeMenu="Edit Profile">
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-24">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
              Profile Settings
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Manage your identity, work information, and workspace preferences.
            </p>
          </div>
          {/* Status badge */}
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-muted)] shadow-sm w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {user?.role === "admin" ? "Administrator" : "Team Member"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">

          {/* ── LEFT COL ──────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Avatar + Identity Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <SectionHeading
                title="Profile Identity"
                subtitle="Your public-facing name, avatar, and professional headline."
              />

              {/* Avatar Row */}
              <div className="mb-7 flex items-center gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={form.name}
                      className="h-20 w-20 rounded-full object-cover border-2 border-[var(--border)] shadow-sm"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--bg-soft)] text-2xl font-bold text-[var(--accent)] shadow-sm select-none">
                      {userInitial}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] shadow transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    title="Change photo"
                  >
                    <LuCamera className="text-[13px]" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Name + meta */}
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-[var(--text)] truncate">{form.name || "Your Name"}</p>
                  <p className="text-[13px] text-[var(--text-muted)] truncate">
                    {form.title || "Add your job title below"}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 text-[12px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    {avatarPreview ? "Change photo" : "Upload photo"}
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <StyledInput
                    icon={LuUser}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Email Address">
                  <StyledInput
                    icon={LuMail}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@company.com"
                  />
                </Field>

                <Field label="Job Title">
                  <StyledInput
                    icon={LuBriefcase}
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Frontend Developer"
                  />
                </Field>

                <Field label="Company / Team">
                  <StyledInput
                    icon={LuBuilding2}
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    placeholder="e.g. Acme Inc."
                  />
                </Field>
              </div>
            </div>

            {/* Bio & Skills */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <SectionHeading
                title="Bio & Skills"
                subtitle="Describe yourself and list your core competencies."
              />

              <div className="space-y-4">
                <Field label="Professional Bio" hint="Max 280 chars">
                  <StyledTextarea
                    value={form.bio}
                    maxLength={280}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Write a short professional summary about yourself…"
                  />
                  <p className="mt-1 text-right text-[11px] text-[var(--text-muted)]">
                    {form.bio.length}/280
                  </p>
                </Field>

                <Field label="Skills" hint="Press Enter to add">
                  <SkillTagInput
                    skills={form.skills}
                    onChange={(skills) => setForm((p) => ({ ...p, skills }))}
                  />
                </Field>
              </div>
            </div>

            {/* Password */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <SectionHeading
                title="Change Password"
                subtitle="Leave blank to keep your current password."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="New Password">
                  <StyledInput
                    icon={LuLock}
                    type="password"
                    value={password.next}
                    onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
                    placeholder="New password"
                  />
                </Field>

                <Field label="Confirm Password">
                  <StyledInput
                    icon={LuShield}
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </Field>
              </div>

              {password.next && password.confirm && password.next !== password.confirm && (
                <p className="mt-3 text-[12.5px] font-medium text-red-500">
                  Passwords do not match.
                </p>
              )}
              {password.next && password.confirm && password.next === password.confirm && (
                <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-[#4C7F6A]">
                  <LuBadgeCheck className="text-base" /> Passwords match.
                </p>
              )}
            </div>

          </div>

          {/* ── RIGHT COL ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Profile Summary Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Profile Summary
              </p>

              <div className="flex flex-col items-center text-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={form.name}
                    className="h-16 w-16 rounded-full object-cover border border-[var(--border)] shadow mb-3"
                  />
                ) : (
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-xl font-bold text-[var(--accent)]">
                    {userInitial}
                  </div>
                )}

                <p className="text-[15px] font-semibold text-[var(--text)]">{form.name || "—"}</p>
                <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">{form.title || "No title set"}</p>
                {form.company && (
                  <p className="mt-0.5 text-[12px] text-[var(--text-muted)] opacity-70">{form.company}</p>
                )}

                {form.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {form.skills.slice(0, 5).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)]"
                      >
                        {s}
                      </span>
                    ))}
                    {form.skills.length > 5 && (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                        +{form.skills.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {form.bio && (
                  <p className="mt-4 text-[12px] text-[var(--text-muted)] leading-5 line-clamp-3 border-t border-[var(--border)] pt-4 text-left">
                    {form.bio}
                  </p>
                )}
              </div>
            </div>

            {/* AI Feature Readiness */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  AI Features
                </p>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Coming Soon
                </span>
              </div>

              <div className="space-y-2.5">
                <AIFeatureCard
                  label="Skill Recommendations"
                  description="AI-curated skills based on your task history and team gaps."
                  badge="Beta"
                />
                <AIFeatureCard
                  label="Profile Optimizer"
                  description="Get personalized suggestions to strengthen your professional summary."
                  badge="Soon"
                />
                <AIFeatureCard
                  label="Productivity Insights"
                  description="Understand your peak productivity windows and task patterns."
                  badge="Soon"
                />
              </div>
            </div>

            {/* Account Metadata */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Account Info
              </p>
              <dl className="space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-muted)]">Role</dt>
                  <dd className="font-medium text-[var(--text)] capitalize">{user?.role || "Member"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-muted)]">Member since</dt>
                  <dd className="font-medium text-[var(--text)]">
                    {user?.createdAt
                      ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(user.createdAt))
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-muted)]">Skills on file</dt>
                  <dd className="font-medium text-[var(--text)]">{form.skills.length}</dd>
                </div>
              </dl>
            </div>

          </div>
        </div>
      </div>

      {/* ── Sticky Save Bar ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="text-[12.5px] text-[var(--text-muted)] hidden sm:block">
            Changes are saved to your account and reflected across the workspace.
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => {
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
                setPassword({ current: "", next: "", confirm: "" });
              }}
              disabled={isBusy}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-[13px] font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--bg-soft)] hover:text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <LuLoader className="text-base animate-spin" />
              ) : saved ? (
                <LuCheck className="text-base" />
              ) : (
                <LuPencil className="text-base" />
              )}
              {isBusy ? "Saving…" : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditProfile;
