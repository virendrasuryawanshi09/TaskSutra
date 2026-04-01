import React from "react";

const CustomLegend = ({ payload }) => {
  return (
    <div className="flex justify-center flex-wrap gap-4 mt-3">
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          ></span>
          <span className="font-medium">
            {entry.payload?.status}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CustomLegend;