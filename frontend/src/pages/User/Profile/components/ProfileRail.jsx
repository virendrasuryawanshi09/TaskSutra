/* SVG ring progress around avatar */
const Ring = ({ pct }) => {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="var(--accent)" strokeWidth="2.5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};

const Stat = ({ label, value }) => (
  <div>
    <p className="text-[18px] font-bold text-[var(--text)] leading-none">{value}</p>
    <p className="text-[10.5px] text-[var(--text-muted)] mt-0.5 uppercase tracking-wide">{label}</p>
  </div>
);

const ProfileRail = ({ form, avatarPreview, user }) => {
  const userInitial = form.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const fields = [form.name, form.email, form.title, form.company, form.bio, form.skills?.length > 0, avatarPreview];
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(user.createdAt))
    : "—";

  return (
    <div className="flex flex-col gap-5">

      {/* ── Identity card ─────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">

        {/* Avatar + ring */}
        <div className="relative w-[88px] h-[88px] mx-auto mb-4">
          <Ring pct={pct} />
          <div className="absolute inset-[8px] rounded-full overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt={form.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--accent)]/15 to-[var(--bg-soft)] flex items-center justify-center text-[22px] font-bold text-[var(--accent)]">
                {userInitial}
              </div>
            )}
          </div>
          {/* pct label */}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[var(--accent)] bg-[var(--surface)] px-1.5 py-0.5 rounded-full border border-[var(--border)]">
            {pct}%
          </span>
        </div>

        <div className="text-center">
          <p className="text-[15px] font-semibold text-[var(--text)] leading-tight">
            {form.name || "Your Name"}
          </p>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate">
            {form.title || "—"}
          </p>
          {form.company && (
            <p className="text-[11px] text-[var(--text-muted)]/60 mt-0.5 truncate">{form.company}</p>
          )}
          {/* Role badge */}
          <span className="inline-block mt-3 font-mono text-[10px] font-bold tracking-wider uppercase text-[var(--accent)] bg-[var(--accent)]/8 border border-[var(--accent)]/20 rounded-md px-2.5 py-1">
            {user?.role || "member"}
          </span>
        </div>

        {/* Stats row */}
        <div className="mt-5 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-3">
          <Stat label="Skills" value={form.skills?.length || 0} />
          <Stat label="Since" value={memberSince} />
        </div>
      </div>

      {/* ── Completeness block ────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Completeness
          </span>
          <span className="text-[12px] font-bold text-[var(--accent)]">{pct}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-[var(--bg-soft)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2.5 text-[11px] text-[var(--text-muted)]/70 leading-[1.5]">
          {pct < 100 ? "Fill in all fields to unlock AI-powered features." : "Your profile is fully complete ✦"}
        </p>
      </div>

      {/* ── Skills preview ────────────────────────── */}
      {form.skills?.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] block mb-3">
            Skills
          </span>
          <div className="flex flex-wrap gap-1.5">
            {form.skills.map((s) => (
              <span
                key={s}
                className="rounded-md border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── AI teaser ─────────────────────────────── */}
      <div className="rounded-2xl border border-dashed border-[var(--accent)]/30 bg-[var(--accent)]/3 p-4">
        <p className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wide mb-1">
          AI Features · Coming Soon
        </p>
        <p className="text-[11.5px] text-[var(--text-muted)] leading-[1.6]">
          Skill recommendations, profile optimization, and productivity insights — powered by your TaskSutra history.
        </p>
      </div>

    </div>
  );
};

export default ProfileRail;
