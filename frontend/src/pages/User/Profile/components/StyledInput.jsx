const StyledInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[14px] pointer-events-none" />
    )}
    <input
      {...props}
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] py-2.5 text-[13.5px] font-medium text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-normal outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 focus:bg-[var(--surface)] ${Icon ? "pl-10 pr-4" : "px-4"} ${props.disabled ? "opacity-40 cursor-not-allowed" : "hover:border-[var(--text-muted)]/40"}`}
    />
  </div>
);

export const StyledTextarea = (props) => (
  <textarea
    {...props}
    rows={3}
    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-normal outline-none resize-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 focus:bg-[var(--surface)] hover:border-[var(--text-muted)]/40"
  />
);

export default StyledInput;
