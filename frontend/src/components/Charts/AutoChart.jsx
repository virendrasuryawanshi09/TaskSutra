import React from 'react';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, Cell as RechartsCell } from 'recharts';
import { LuLayers } from 'react-icons/lu';

const AutoChart = ({ data }) => {
  if (!Array.isArray(data) || data.length < 2) return null;
  const sample = data[0];
  const keys = Object.keys(sample);
  const valueKey = keys.find(k => typeof sample[k] === 'number' && k !== '__v' && k !== 'progress' && k !== 'estimatedComplexityScore');
  const labelKey = keys.find(k => typeof sample[k] === 'string' && k !== '_id' && k !== 'companyId');

  if (!valueKey || !labelKey) return null;

  const chartData = data.map(item => ({
    name: item[labelKey] || "Unknown",
    value: item[valueKey]
  }));

  const chartColors = ["#4F46E5", "#D97706", "#059669", "#2563EB", "#7C3AED", "#EC4899", "#10B981"];

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-3">
      <span className="text-[10px] font-bold text-[var(--accent)] tracking-wider uppercase flex items-center gap-1.5">
        <LuLayers size={13} className="text-[var(--accent)]" /> Data Visualization
      </span>
      <div className="h-[200px] w-full pt-2 overflow-hidden">
        <BarChart
          width={500}
          height={200}
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          style={{ width: "100%", height: "100%" }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
          <RechartsTooltip 
            cursor={{ fill: 'var(--bg-soft)', opacity: 0.4 }}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px', color: 'var(--text)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <RechartsCell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </div>
    </div>
  );
};

export default AutoChart;
