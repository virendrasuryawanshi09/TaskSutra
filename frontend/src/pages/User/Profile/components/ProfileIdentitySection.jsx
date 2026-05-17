import { useRef } from "react";
import { LuCamera, LuUser, LuMail, LuBriefcase, LuBuilding2, LuLock, LuShield, LuBadgeCheck } from "react-icons/lu";
import ProfileField from "./ProfileField";
import StyledInput, { StyledTextarea } from "./StyledInput";
import SkillTagInput from "./SkillTagInput";

const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-4">
    {children}
  </p>
);

const Divider = () => (
  <div className="h-px bg-[var(--border)] my-7" />
);

const ProfileIdentitySection = ({ form, setForm, avatarPreview, setAvatarPreview, setAvatarFile, password, setPassword }) => {
  const fileRef = useRef(null);
  const userInitial = form.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const pwMatch = password.next && password.confirm && password.next === password.confirm;
  const pwMismatch = password.next && password.confirm && password.next !== password.confirm;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">

      {/* ── Identity Header ─────────────────────────────── */}
      <div className="px-7 pt-7 pb-6 border-b border-[var(--border)] flex items-center gap-5">
        {/* Avatar */}
        <div className="relative shrink-0 group">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={form.name}
              className="h-[72px] w-[72px] rounded-2xl object-cover border border-[var(--border)] shadow-sm"
            />
          ) : (
            <div className="h-[72px] w-[72px] rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/10 to-[var(--bg-soft)] flex items-center justify-center text-2xl font-bold text-[var(--accent)] shadow-sm select-none">
              {userInitial}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 cursor-pointer"
            title="Change photo"
          >
            <LuCamera className="text-white text-lg" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-[var(--text)] tracking-tight truncate">
            {form.name || "Your Name"}
          </p>
          <p className="text-[13px] text-[var(--text-muted)] truncate mt-0.5">
            {form.title || "Add your job title below"}
            {form.company ? ` · ${form.company}` : ""}
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2 text-[12px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            {avatarPreview ? "Change photo" : "Upload photo"}
          </button>
        </div>
      </div>

      {/* ── Basic Info ──────────────────────────────────── */}
      <div className="px-7 pt-6 pb-0">
        <SectionLabel>Basic Information</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField label="Full Name">
            <StyledInput icon={LuUser} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
          </ProfileField>
          <ProfileField label="Email Address">
            <StyledInput icon={LuMail} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@company.com" />
          </ProfileField>
          <ProfileField label="Job Title">
            <StyledInput icon={LuBriefcase} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Frontend Developer" />
          </ProfileField>
          <ProfileField label="Company / Team">
            <StyledInput icon={LuBuilding2} value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="e.g. Acme Inc." />
          </ProfileField>
        </div>
      </div>

      <Divider />

      {/* ── Bio & Skills ────────────────────────────────── */}
      <div className="px-7 pb-0">
        <SectionLabel>Bio &amp; Skills</SectionLabel>
        <div className="space-y-4">
          <ProfileField label="Professional Bio" hint={`${form.bio.length}/280`}>
            <StyledTextarea
              value={form.bio}
              maxLength={280}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="A concise professional summary that tells your team who you are…"
            />
          </ProfileField>
          <ProfileField label="Skills" hint="Enter to add">
            <SkillTagInput skills={form.skills} onChange={(skills) => setForm((p) => ({ ...p, skills }))} />
          </ProfileField>
        </div>
      </div>

      <Divider />

      {/* ── Password ────────────────────────────────────── */}
      <div className="px-7 pb-7">
        <SectionLabel>Change Password</SectionLabel>
        <p className="text-[12px] text-[var(--text-muted)] mb-4 -mt-2">
          Leave blank to keep your current password.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField label="New Password">
            <StyledInput icon={LuLock} type="password" value={password.next} onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))} placeholder="New password" />
          </ProfileField>
          <ProfileField label="Confirm Password">
            <StyledInput icon={LuShield} type="password" value={password.confirm} onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" />
          </ProfileField>
        </div>
        {pwMismatch && (
          <p className="mt-3 text-[12.5px] font-medium text-red-500">Passwords do not match.</p>
        )}
        {pwMatch && (
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-600">
            <LuBadgeCheck className="text-base" /> Passwords match.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileIdentitySection;
