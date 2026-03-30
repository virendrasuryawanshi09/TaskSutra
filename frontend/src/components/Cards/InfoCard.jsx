import React from "react";

const InfoCard = ({ icon, label, title, value, color = "#1F6F78" }) => {
  const resolvedLabel = label || title || "Untitled";

  return (
    <div className="relative group overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-white/40 to-white/10 hover:from-white/60 hover:to-white/20 transition-all duration-300">

      {/* Glass Card */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm group-hover:shadow-lg transition-all duration-300">

        {/* Glow Effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 blur-2xl"
          style={{ background: `${color}30` }}
        ></div>

        {/* Icon */}
        <div
          className="relative flex items-center justify-center w-12 h-12 rounded-xl shadow-inner"
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
          <span className="text-xs tracking-wide text-gray-500 uppercase">
            {resolvedLabel}
          </span>

          <span className="text-xl font-bold text-gray-900 tracking-tight">
            {value}
          </span>
        </div>

      </div>
    </div>
  );
};

export default InfoCard;