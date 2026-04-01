import React from "react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-xs text-[var(--text-muted)]">
          {payload[0].name}
        </p>
        <p className="text-sm font-semibold text-[var(--text)]">
          {payload[0].value} Tasks
        </p>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;