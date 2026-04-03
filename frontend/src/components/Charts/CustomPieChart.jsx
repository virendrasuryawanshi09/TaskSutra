import React, { useEffect, useMemo, useState } from "react";
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
  const [animatedTotal, setAnimatedTotal] = useState(0);

  const totalTasks = useMemo(
    () =>
      Array.isArray(data)
        ? data.reduce((sum, item) => sum + Number(item?.count || 0), 0)
        : 0,
    [data]
  );

  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((item) => {
        const count = Number(item?.count || 0);
        const percentage =
          totalTasks > 0
            ? Number(((count / totalTasks) * 100).toFixed(1))
            : 0;

        return { ...item, count, percentage };
      }),
    [data, totalTasks]
  );

  useEffect(() => {
    let frame;
    const duration = 800;
    const start = performance.now();

    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(Math.round(totalTasks * eased));

      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    setAnimatedTotal(0);
    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [totalTasks]);


  const getGradientId = (index) => `pieGradient-${index}`;

  const getGradientColors = (color) => {
    return [color, `${color}99`];
  };

  if (!chartData || chartData.every((item) => item.count === 0)) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-[var(--text-muted)]">
        No task data available
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="mx-auto h-[260px] w-full max-w-[340px] sm:h-[300px] sm:max-w-[380px]">

        <ResponsiveContainer>
          <PieChart>

            {/* GRADIENT DEFINITIONS */}
            <defs>
              {chartData.map((entry, index) => {
                const [start, end] = getGradientColors(
                  colors[index % colors.length]
                );
                return (
                  <linearGradient
                    key={index}
                    id={getGradientId(index)}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={start} />
                    <stop offset="100%" stopColor={end} />
                  </linearGradient>
                );
              })}
            </defs>

            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="82%"
              paddingAngle={3}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={`url(#${getGradientId(index)})`}
                  style={{
                    transform:
                      activeIndex === index ? "scale(1.04)" : "scale(1)",
                    transformOrigin: "center",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                    filter:
                      activeIndex === index
                        ? "brightness(1.1)"
                        : "brightness(1)",
                  }}
                />
              ))}
            </Pie>

            {/* CENTER CONTENT */}
            <g>
              <text
                x="49%"
                y="43%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text)"
                style={{
                  fontSize: "30px",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                }}
              >
                {animatedTotal}
              </text>

              <text
                x="50%"
                y="54%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text-muted)"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Tasks
              </text>
            </g>

            <Tooltip
              wrapperStyle={{ pointerEvents: "none" }}
              content={<CustomTooltip />}
            />

            <Legend content={<CustomLegend colors={colors} />} />

          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomPieChart;