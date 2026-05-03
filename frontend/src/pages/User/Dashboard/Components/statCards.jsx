import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ── Animated counter ──────────────────────────────────────────────────────────
const useCountUp = (target = 0, duration = 900) => {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
};

// ── SVG ring progress ─────────────────────────────────────────────────────────
const Ring = ({ pct = 0, color, size = 52, stroke = 4 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bg-soft)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
    </svg>
  );
};

// ── Single stat card ──────────────────────────────────────────────────────────
const StatCard = ({ label, value = 0, total = 0, icon: Icon, color, accentBg, delay = 0 }) => {
  const animatedValue = useCountUp(value, 900);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]"
    >
      {/* subtle gradient wash on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse at top left, ${accentBg}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: accentBg, color }}
        >
          <Icon />
        </div>

        {/* Ring */}
        <Ring pct={pct} color={color} />
      </div>

      <div className="relative mt-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)]">
          {animatedValue}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {total > 0 ? `${pct}% of total` : "No tasks yet"}
        </p>
      </div>

      {/* bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
};

// ── Exported grid ─────────────────────────────────────────────────────────────
const StatCards = ({ total = 0, inProgress = 0, completed = 0, overdue = 0 }) => {
  const cards = [
    {
      label: "Total Tasks",
      value: total,
      total,
      icon: (props) => (
        <svg {...props} viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      ),
      color: "#2F7A84",
      accentBg: "rgba(47,122,132,0.12)",
      delay: 0,
    },
    {
      label: "In Progress",
      value: inProgress,
      total,
      icon: (props) => (
        <svg {...props} viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      ),
      color: "#1F6F78",
      accentBg: "rgba(31,111,120,0.12)",
      delay: 0.07,
    },
    {
      label: "Completed",
      value: completed,
      total,
      icon: (props) => (
        <svg {...props} viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      color: "#4C7F6A",
      accentBg: "rgba(76,127,106,0.12)",
      delay: 0.14,
    },
    {
      label: "Overdue",
      value: overdue,
      total,
      icon: (props) => (
        <svg {...props} viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      color: "#B2554A",
      accentBg: "rgba(178,85,74,0.12)",
      delay: 0.21,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
};

export default StatCards;
