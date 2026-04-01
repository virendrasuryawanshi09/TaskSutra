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
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const totalTasks = useMemo(
    () => (Array.isArray(data) ? data.reduce((sum, item) => sum + Number(item?.count || 0), 0) : 0),
    [data]
  );
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((item) => {
        const count = Number(item?.count || 0);
        const percentage = totalTasks > 0 ? Number(((count / totalTasks) * 100).toFixed(1)) : 0;

        return {
          ...item,
          count,
          percentage,
        };
      }),
    [data, totalTasks]
  );

  useEffect(() => {
    let animationFrameId;
    const animationDuration = 850;
    const startValue = 0;
    const endValue = totalTasks;
    const startTime = performance.now();

    const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3);

    const animateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeOutCubic(progress);
      const nextValue = Math.round(startValue + (endValue - startValue) * easedProgress);

      setAnimatedTotal(nextValue);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(animateValue);
      }
    };

    setAnimatedTotal(0);
    animationFrameId = window.requestAnimationFrame(animateValue);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [totalTasks]);

  const handleSliceEnter = (slice, index) => {
    setActiveIndex(index);

    const radians = Math.PI / 180;
    const angle = -slice.midAngle * radians;
    const distance = slice.outerRadius + 12;
    const rawX = slice.cx + Math.cos(angle) * distance;
    const rawY = slice.cy + Math.sin(angle) * distance;
    const isLeftSide = Math.cos(angle) < 0;

    setTooltipPosition({
      x: rawX - (isLeftSide ? 102 : 14),
      y: rawY - 30,
    });
  };

  const handleSliceLeave = () => {
    setActiveIndex(null);
    setTooltipPosition(null);
  };

  return (
    <div className="pt-3">
      <div className="mx-auto h-[250px] w-full max-w-[320px] sm:h-[290px] sm:max-w-[380px] lg:h-[320px] lg:max-w-none">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="48%"
            innerRadius="54%"
            outerRadius="78%"
            paddingAngle={4}
            onMouseEnter={handleSliceEnter}
            onMouseLeave={handleSliceLeave}
          >
            {chartData.map((entry, index) => (
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

          <g transform="translate(0, 0)">
            <text
              x="50%"
              y="43%"
              dy="-8"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text)"
              style={{
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              {animatedTotal}
            </text>

            <text
              x="50%"
              y="45%"
              dy="18"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text-muted)"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Total Tasks
            </text>
          </g>

          <Tooltip
            position={tooltipPosition || undefined}
            wrapperStyle={{ pointerEvents: "none", zIndex: 20 }}
            content={<CustomTooltip />}
          />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomPieChart;
