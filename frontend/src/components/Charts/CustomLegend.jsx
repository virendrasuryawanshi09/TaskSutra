import React from "react";

const CustomLegend = ({ payload, colors }) => {
  if (!payload) return null;

  return (
    <div className="flex justify-center gap-6 mt-4 flex-wrap">
      {payload.map((entry, index) => {
        const color = colors[index]; // ✅ FIX

        return (
          <div
            key={index}
            className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />

            <span className="font-medium">
              {entry.value || entry.payload?.status}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CustomLegend;