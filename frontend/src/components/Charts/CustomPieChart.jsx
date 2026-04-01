import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import CustomLegend from "./CustomLegend";

const CustomPieChart = ({ data, colors }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 transition-all duration-300 hover:shadow-xl">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          Task Distribution
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          Overview
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={85}
            outerRadius={115}
            paddingAngle={3}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                style={{
                  filter:
                    activeIndex === index
                      ? "brightness(1.15)"
                      : "brightness(1)",
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                }}
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;