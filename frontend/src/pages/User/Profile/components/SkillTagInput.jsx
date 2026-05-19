import { useState } from "react";
import { LuX } from "react-icons/lu";

const SkillTagInput = ({ skills, onChange }) => {
  const [input, setInput] = useState("");

  const addSkill = (val) => {
    const trimmed = val.trim();
    if (trimmed && !skills.includes(trimmed)) onChange([...skills, trimmed]);
    setInput("");
  };

  return (
    <div className="mt-1">
      {/* Tags */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill) => (
            <span
              key={skill}
              className="group flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--text)] tracking-tight"
            >
              {skill}
              <button
                type="button"
                onClick={() => onChange(skills.filter((s) => s !== skill))}
                className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
              >
                <LuX className="text-[9px]" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Input */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(input); }
          if (e.key === "Backspace" && !input && skills.length > 0) onChange(skills.slice(0, -1));
        }}
        onBlur={() => input && addSkill(input)}
        placeholder="Type a skill, press Enter…"
        className="w-full bg-transparent border-b border-[var(--border)] py-2.5 text-[13.5px] font-medium text-[var(--text)] placeholder:text-[var(--text-muted)]/50 placeholder:font-normal outline-none transition-all duration-200 focus:border-[var(--accent)]"
      />
    </div>
  );
};

export default SkillTagInput;
