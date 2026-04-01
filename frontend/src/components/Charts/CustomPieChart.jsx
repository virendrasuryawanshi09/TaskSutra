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
    <div className="pt-3">
      <div className="mx-auto h-[250px] w-full max-w-[320px] sm:h-[290px] sm:max-w-[380px] lg:h-[320px] lg:max-w-none">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="46%"
            innerRadius="54%"
            outerRadius="78%"
            paddingAngle={4}
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
    </div>
  );
};

export default CustomPieChart;
