import React from "react";

const InfoCard = ({ icon, label, title, value, color = "#1F6F78" }) => {
  const resolvedLabel = label || title || "Untitled";

  return (
    <div className="relative group overflow-hidden rounded-2xl p-[1px]">

      {/* Border Layer */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: `${color}20` }}
      ></div>

      {/* Card */}
      <div className="relative flex min-h-[82px] items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 shadow-sm transition-all duration-300 group-hover:shadow-lg sm:min-h-[92px] sm:gap-3 sm:px-4 sm:py-4 md:min-h-[104px] md:gap-4 md:p-5">

        {/* Icon */}
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 md:h-12 md:w-12"
          style={{ backgroundColor: `${color}15` }}
        >
          <div
            className="text-base transition-transform duration-300 group-hover:scale-110 sm:text-lg md:text-xl"
            style={{ color: color }}
          >
            {icon || resolvedLabel.charAt(0)}
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex flex-col">
          <span className="text-[9px] uppercase leading-3 tracking-[0.08em] text-[var(--text-muted)] sm:text-[10px] sm:leading-4 sm:tracking-[0.1em] md:text-xs md:tracking-wide">
            {resolvedLabel}
          </span>

          <span className="mt-1 text-lg font-bold leading-none tracking-tight text-[var(--text)] sm:text-xl md:text-2xl">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
