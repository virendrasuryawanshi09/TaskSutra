import React from "react";

const MyTasksSectionHeader = ({ eyebrow, title, description, action }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text)]">
            {title}
          </h2>

          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
};

export default MyTasksSectionHeader;
