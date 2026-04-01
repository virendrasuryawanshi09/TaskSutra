import React from "react";

const CustomLegend = ({ payload }) => {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2 sm:mt-5">
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] sm:text-xs"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          ></span>
          <span className="font-medium tracking-[0.01em]">
            {entry.payload?.status}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CustomLegend;
