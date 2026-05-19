const StyledInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[13px] pointer-events-none" />
    )}
    <input
      {...props}
      className={[
        "w-full bg-transparent border-b border-[var(--border)] py-2.5 text-[13.5px] font-medium text-[var(--text)]",
        "placeholder:text-[var(--text-muted)]/50 placeholder:font-normal outline-none transition-all duration-200",
        "focus:border-[var(--accent)] hover:border-[var(--text-muted)]/50",
        Icon ? "pl-8 pr-2" : "pl-0 pr-2",
        props.disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    />
  </div>
);

export const StyledTextarea = (props) => (
  <textarea
    {...props}
    rows={3}
    className="w-full bg-transparent border-b border-[var(--border)] py-2.5 pr-2 text-[13.5px] font-medium text-[var(--text)] placeholder:text-[var(--text-muted)]/50 placeholder:font-normal outline-none resize-none transition-all duration-200 focus:border-[var(--accent)] hover:border-[var(--text-muted)]/50"
  />
);

export default StyledInput;
