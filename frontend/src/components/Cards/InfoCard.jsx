import React from "react";

const DEFAULT_ACCENT = "#1F6F78";

const InfoCard = ({ icon, label, title, value, color = DEFAULT_ACCENT }) => {
  const resolvedLabel = label || title || "Untitled";
  const resolvedColor = color.startsWith("#") ? color : DEFAULT_ACCENT;

  return (
    <div className="flex items-center gap-4 p-5 bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] hover:shadow-md transition-all duration-300">

      {/* Icon Section */}
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl"
        style={{ backgroundColor: `${resolvedColor}20` }}
      >
        <div style={{ color: resolvedColor }} className="text-xl font-semibold">
          {icon || resolvedLabel.charAt(0)}
        </div>
      </div>

      {/* Text Section */}
      <div className="flex flex-col">
        <span className="text-sm text-[var(--text-muted)]">{resolvedLabel}</span>
        <span className="text-lg font-semibold text-[var(--text)]">
          {value}
        </span>
      </div>

    </div>
  );
};

export default InfoCard;
