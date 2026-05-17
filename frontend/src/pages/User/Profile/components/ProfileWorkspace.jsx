import { useRef } from "react";
import { LuCamera, LuUser, LuMail, LuBriefcase, LuBuilding2, LuLock, LuShield, LuBadgeCheck } from "react-icons/lu";
import StyledInput, { StyledTextarea } from "./StyledInput";
import SkillTagInput from "./SkillTagInput";

/* ── Section block with editorial number index ── */
const Section = ({ index, title, children }) => (
  <div className="py-8 border-b border-[var(--border)] last:border-none">
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[10px] font-mono font-bold text-[var(--accent)]/60 tracking-widest w-5 shrink-0">
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="text-[13px] font-semibold text-[var(--text)] tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
    {children}
  </div>
);

/* ── Inline field: label left, input right ── */
const InlineField = ({ label, hint, children }) => (
  <div className="grid grid-cols-[140px_1fr] gap-4 items-start py-1">
    <div>
      <span className="text-[11.5px] font-medium text-[var(--text-muted)]">{label}</span>
      {hint && <span className="block text-[10.5px] text-[var(--text-muted)]/50 mt-0.5">{hint}</span>}
    </div>
    <div>{children}</div>
  </div>
);

const ProfileWorkspace = ({ form, setForm, avatarPreview, setAvatarPreview, setAvatarFile, password, setPassword }) => {
  const fileRef = useRef(null);
  const pwMatch = password.next && password.confirm && password.next === password.confirm;
  const pwMismatch = password.next && password.confirm && password.next !== password.confirm;

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm px-8">

      {/* ── 01 · Identity ───────────────────────────────── */}
      <Section index={1} title="Identity">
        <div className="space-y-1">
          <InlineField label="Display Name">
            <StyledInput icon={LuUser} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
          </InlineField>
          <InlineField label="Email">
            <StyledInput icon={LuMail} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@company.com" />
          </InlineField>
          <InlineField label="Job Title">
            <StyledInput icon={LuBriefcase} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Frontend Developer" />
          </InlineField>
          <InlineField label="Company">
            <StyledInput icon={LuBuilding2} value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="e.g. Acme Inc." />
          </InlineField>
          <InlineField label="Photo">
            <div className="flex items-center gap-3 py-1.5">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-9 w-9 rounded-lg object-cover border border-[var(--border)]" />
              ) : (
                <div className="h-9 w-9 rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] flex items-center justify-center text-[13px] font-bold text-[var(--accent)]">
                  {form.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                <LuCamera className="text-[13px]" />
                {avatarPreview ? "Change photo" : "Upload photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }} />
            </div>
          </InlineField>
        </div>
      </Section>

      {/* ── 02 · About ──────────────────────────────────── */}
      <Section index={2} title="About">
        <div className="space-y-1">
          <InlineField label="Bio" hint="max 280 chars">
            <div>
              <StyledTextarea
                value={form.bio}
                maxLength={280}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="A short professional summary…"
              />
              <span className="text-[10.5px] text-[var(--text-muted)]/50 mt-1 block text-right">
                {form.bio.length} / 280
              </span>
            </div>
          </InlineField>
          <InlineField label="Skills" hint="Enter to add">
            <SkillTagInput skills={form.skills} onChange={(skills) => setForm((p) => ({ ...p, skills }))} />
          </InlineField>
        </div>
      </Section>

      {/* ── 03 · Security ───────────────────────────────── */}
      <Section index={3} title="Security">
        <div className="space-y-1">
          <InlineField label="New Password">
            <StyledInput icon={LuLock} type="password" value={password.next} onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))} placeholder="Enter new password" />
          </InlineField>
          <InlineField label="Confirm">
            <StyledInput icon={LuShield} type="password" value={password.confirm} onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" />
          </InlineField>
        </div>
        {pwMismatch && <p className="mt-4 ml-[156px] text-[11.5px] font-medium text-red-500">Passwords do not match.</p>}
        {pwMatch && (
          <p className="mt-4 ml-[156px] flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-600">
            <LuBadgeCheck className="text-sm" /> Passwords match
          </p>
        )}
        <p className="mt-4 ml-[156px] text-[11px] text-[var(--text-muted)]/50">
          Leave blank to keep your current password.
        </p>
      </Section>

    </div>
  );
};

export default ProfileWorkspace;
