import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const Input = ({ value, onChange, type, label }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === "password";
  const isActive = isFocused || value.length > 0;

  return (
    <div className="relative mb-7">

      <input
        type={isPassword ? (showPassword ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="
          w-full border-b bg-transparent py-3 text-sm outline-none
          border-[var(--border)]
          text-[var(--text)]
          focus:border-[var(--accent)]
          transition-all duration-200
        "
      />

      <label
        className={`
          absolute left-0 transition-all duration-200 pointer-events-none
          ${
            isActive
              ? "-top-2.5 text-[11px] text-[var(--accent)]"
              : "top-2 text-[13px] text-[var(--text-muted)]"
          }
        `}
      >
        {label}
      </label>

      {isPassword && (
        <div
          className="absolute right-0 top-2 cursor-pointer text-[var(--text-muted)]"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
        </div>
      )}
    </div>
  );
};

export default Input;