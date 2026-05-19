const ProfileField = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </label>
      {hint && <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>}
    </div>
    {children}
  </div>
);

export default ProfileField;
