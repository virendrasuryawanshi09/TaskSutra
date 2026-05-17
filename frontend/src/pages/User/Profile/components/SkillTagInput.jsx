import { useState } from "react";
import { LuX } from "react-icons/lu";

const SkillTagInput = ({ skills, onChange }) => {
  const [input, setInput] = useState("");

  const addSkill = (val) => {
    const trimmed = val.trim();
    if (trimmed && !skills.includes(trimmed)) onChange([...skills, trimmed]);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(input); }
    if (e.key === "Backspace" && !input && skills.length > 0) onChange(skills.slice(0, -1));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 transition-all duration-150 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10 focus-within:bg-[var(--surface)] hover:border-[var(--text-muted)]/40">
      {skills.map((skill) => (
        <span
          key={skill}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[12px] font-semibold text-[var(--text)] shadow-sm"
        >
          {skill}
          <button
            type="button"
            onClick={() => onChange(skills.filter((s) => s !== skill))}
            className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            <LuX className="text-[10px]" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addSkill(input)}
        placeholder={skills.length === 0 ? "Type a skill, press Enter…" : "Add more…"}
        className="flex-1 min-w-[130px] bg-transparent text-[13px] font-medium text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-normal outline-none"
      />
    </div>
  );
};

export default SkillTagInput;
