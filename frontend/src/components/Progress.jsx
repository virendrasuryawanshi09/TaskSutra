import React from "react";

const Progress = ({ progress = 0, status }) => {

  const getGradient = () => {
    switch (status) {
      case "Completed":
        return "from-green-400 to-green-600";

      case "In Progress":
        return "from-cyan-400 to-cyan-600";

      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <div className="relative w-full">

      {/* 🔥 TRACK */}
      <div className="
        w-full h-1.5
        bg-[var(--bg-soft)]
        rounded-full
        overflow-hidden
      ">

        {/* 🔥 PROGRESS BAR */}
        <div
          className={`
            h-full rounded-full
            bg-gradient-to-r ${getGradient()}

            transition-all duration-500 ease-out
          `}
          style={{ width: `${progress}%` }}
        />

      </div>

    </div>
  );
};

export default Progress;