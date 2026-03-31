import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomPieChart = ({ data, colors }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const isDark = document.documentElement.classList.contains("dark");

  const textColor = isDark ? "#E8E6E3" : "#1F1F1D";
  const borderColor = isDark ? "#3A3B37" : "#E2E0DB";
  const surfaceColor = isDark ? "#262724" : "#FFFFFF";

  const total = data.reduce((acc, item) => acc + item.value, 0);

  const handleMouseEnter = (_, index) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="w-full h-[300px] relative">

      {/* CENTER LABEL */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs text-[var(--text-muted)]">Total</span>
        <span className="text-xl font-bold" style={{ color: textColor }}>
          {total}
        </span>
      </div>

      {/* EMPTY STATE */}
      {(!data || data.every(item => item.value === 0)) && (
        <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
          No data available
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>

          {/* GRADIENT DEFINITIONS */}
          <defs>
            {data.map((entry, index) => (
              <linearGradient
                key={index}
                id={`gradient-${index}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={colors[entry.name]} stopOpacity={0.9} />
                <stop offset="100%" stopColor={colors[entry.name]} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>

          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={`url(#gradient-${index})`}
                style={{
                  filter:
                    activeIndex === index
                      ? "drop-shadow(0px 0px 10px rgba(0,0,0,0.2))"
                      : "none",
                  transform:
                    activeIndex === index ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Pie>

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              backgroundColor: surfaceColor,
              border: `1px solid ${borderColor}`,
              borderRadius: "10px",
              color: textColor,
              fontSize: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          />

        </PieChart>
      </ResponsiveContainer>

      {/* LEGEND */}
      <div className="flex justify-center gap-5 mt-4 flex-wrap">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs cursor-pointer transition hover:scale-105"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${colors[item.name]}, ${colors[item.name]}80)`,
              }}
            ></div>

            <span style={{ color: textColor }}>
              {item.name}
            </span>

            <span className="text-[var(--text-muted)]">
              ({item.value})
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CustomPieChart;