import { LuChevronRight } from "react-icons/lu";
import { HiOutlineSparkles } from "react-icons/hi";

const AICard = ({ label, description, badge }) => (
  <div className="group relative flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3.5 transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--surface)] cursor-default overflow-hidden">
    <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)]">
      <HiOutlineSparkles className="text-[13px]" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="text-[12.5px] font-semibold text-[var(--text)]">{label}</p>
        {badge && (
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[11.5px] text-[var(--text-muted)] leading-[1.5]">{description}</p>
    </div>
    <LuChevronRight className="shrink-0 text-[var(--text-muted)] text-sm opacity-30 group-hover:opacity-60 transition-opacity mt-0.5" />
  </div>
);

const ProfileSidebar = ({ form, avatarPreview, user }) => {
  const userInitial = form.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const completeness = [
    form.name?.trim(),
    form.email?.trim(),
    form.title?.trim(),
    form.company?.trim(),
    form.bio?.trim(),
    form.skills?.length > 0,
    avatarPreview,
  ].filter(Boolean).length;

  const pct = Math.round((completeness / 7) * 100);

  return (
    <div className="space-y-4">

      {/* ── Identity Preview ──────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-4">
          Live Preview
        </p>
        <div className="flex flex-col items-center text-center">
          {avatarPreview ? (
            <img src={avatarPreview} alt={form.name} className="h-14 w-14 rounded-2xl object-cover border border-[var(--border)] shadow-sm mb-3" />
          ) : (
            <div className="mb-3 h-14 w-14 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/10 to-[var(--bg-soft)] flex items-center justify-center text-xl font-bold text-[var(--accent)]">
              {userInitial}
            </div>
          )}
          <p className="text-[14px] font-semibold text-[var(--text)] leading-tight">
            {form.name || "—"}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
            {form.title || "No title set"}
          </p>
          {form.company && (
            <p className="mt-0.5 text-[11.5px] text-[var(--text-muted)] opacity-70">{form.company}</p>
          )}
          {form.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {form.skills.slice(0, 4).map((s) => (
                <span key={s} className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                  {s}
                </span>
              ))}
              {form.skills.length > 4 && (
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                  +{form.skills.length - 4}
                </span>
              )}
            </div>
          )}
          {form.bio && (
            <p className="mt-4 text-[11.5px] text-[var(--text-muted)] leading-[1.6] line-clamp-3 border-t border-[var(--border)] pt-4 text-left w-full">
              {form.bio}
            </p>
          )}
        </div>
      </div>

      {/* ── Profile Completeness ─────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Profile Completeness
          </p>
          <span className="text-[12px] font-bold text-[var(--accent)]">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-soft)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2.5 text-[11.5px] text-[var(--text-muted)]">
          {pct < 100 ? "Complete your profile to unlock AI features." : "Your profile is fully complete! ✦"}
        </p>
      </div>

      {/* ── AI Features ──────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            AI Features
          </p>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Soon
          </span>
        </div>
        <div className="space-y-2">
          <AICard label="Skill Recommendations" description="AI-curated skills based on your task history." badge="Beta" />
          <AICard label="Profile Optimizer" description="Personalized suggestions to strengthen your summary." badge="Soon" />
          <AICard label="Productivity Insights" description="Understand your peak productivity windows." badge="Soon" />
        </div>
      </div>

      {/* ── Account Metadata ─────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
          Account
        </p>
        <dl className="space-y-2.5 text-[12.5px]">
          {[
            { label: "Role", value: <span className="capitalize">{user?.role || "Member"}</span> },
            {
              label: "Member since",
              value: user?.createdAt
                ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(user.createdAt))
                : "—",
            },
            { label: "Skills on file", value: form.skills.length },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <dt className="text-[var(--text-muted)]">{label}</dt>
              <dd className="font-semibold text-[var(--text)]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default ProfileSidebar;
