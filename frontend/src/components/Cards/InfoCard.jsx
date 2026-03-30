import React from "react";

const InfoCard = ({ icon, label, title, value, color = "#1F6F78" }) => {
  const resolvedLabel = label || title || "Untitled";

  return (
    <div className="relative group overflow-hidden rounded-2xl p-[1px]">

      {/* Border Layer */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"
        style={{ background: `${color}20` }}
      ></div>

      {/* Card */}
      <div className="relative flex items-center gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm group-hover:shadow-lg transition-all duration-300">

        {/* Icon */}
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <div
            className="text-xl transition-transform duration-300 group-hover:scale-110"
            style={{ color: color }}
          >
            {icon || resolvedLabel.charAt(0)}
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <span className="text-xs tracking-wide text-[var(--text-muted)] uppercase">
            {resolvedLabel}
          </span>

          <span className="text-xl font-bold text-[var(--text)] tracking-tight">
            {value}
          </span>
        </div>

      </div>
    </div>
  );
};

export default InfoCard;