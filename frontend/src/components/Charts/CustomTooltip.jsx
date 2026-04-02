import React from "react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const point = payload[0]?.payload || {};
    const count = Number(point?.count || payload[0]?.value || 0);
    const percentage = Number(point?.percentage || 0);

    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-xl backdrop-blur-md">
        <p className="text-xs text-[var(--text-muted)]">
          {point?.status || payload[0]?.name}
        </p>
        <p className="text-sm font-semibold text-[var(--text)]">
          {count} Tasks ({percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
