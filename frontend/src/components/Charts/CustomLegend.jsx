import React from "react";

const CustomLegend = ({ payload, colors }) => {
  if (!payload) return null;

  const colorByStatus = {
    Pending: colors?.[0] || "#D97706",
    "In Progress": colors?.[1] || "#2F7A84",
    "InProgress": colors?.[1] || "#2F7A84",
    Completed: colors?.[2] || "#4C7F6A",
  };

  const orderedStatuses = ["Pending", "In Progress", "Completed"];
  const normalizedPayload = payload
    .map((entry) => ({
      ...entry,
      status: entry.value || entry.payload?.status,
    }))
    .sort(
      (a, b) =>
        orderedStatuses.indexOf(a.status) - orderedStatuses.indexOf(b.status)
    );

  return (
    <div className="flex justify-center gap-6 mt-4 flex-wrap">
      {normalizedPayload.map((entry, index) => {
        const color = colorByStatus[entry.status] || entry.color;

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
              {entry.status}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CustomLegend;
