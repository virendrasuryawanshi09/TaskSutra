import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList,
} from "recharts";

const CustomBarChart = ({ data }) => {

  const getGradientId = (priority) => {
    return `gradient-${priority}`;
  };

  const getColors = (priority) => {
    switch (priority) {
      case "Low":
        return ["#4C7F6A", "#6FAF96"];
      case "Medium":
        return ["#2F7A84", "#4FB3BF"];
      case "High":
        return ["#D97706", "#F59E0B"];
      default:
        return ["#8884d8", "#A5B4FC"];
    }
  };

  // ✅ PREMIUM TOOLTIP
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 rounded-lg shadow-lg backdrop-blur-md">
          <p className="text-xs text-[var(--text-muted)]">
            {payload[0].payload.priority}
          </p>
          <p className="text-sm font-semibold text-[var(--text)]">
            {payload[0].payload.count} Tasks
          </p>
        </div>
      );
    }
    return null;
  };

  // ✅ EMPTY STATE
  if (!data || data.every(item => item.count === 0)) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-[var(--text-muted)]">
        No priority data available
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
        >

          {/* 🔥 GRADIENT DEFINITIONS */}
          <defs>
            {data.map((entry) => {
              const [start, end] = getColors(entry.priority);
              return (
                <linearGradient
                  key={entry.priority}
                  id={getGradientId(entry.priority)}
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

          {/* GRID */}
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />

          {/* AXIS */}
          <XAxis
            dataKey="priority"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          {/* TOOLTIP */}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />

          {/* BARS */}
          <Bar
            dataKey="count"
            radius={[10, 10, 0, 0]}
            animationDuration={800}
          >
            {/* VALUE LABELS */}
            <LabelList
              dataKey="count"
              position="top"
              style={{
                fill: "var(--text)",
                fontSize: 12,
                fontWeight: 500,
              }}
            />

            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#${getGradientId(entry.priority)})`}
                style={{
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;