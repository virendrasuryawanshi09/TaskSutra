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
        onChange={(e) => onChange(e)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="
          w-full border-b border-[#E2E0DB] bg-transparent py-2 text-sm outline-none
          focus:border-[#1F6F78]
        "
      />

      <label
        className={`
          absolute left-0 transition-all duration-200 pointer-events-none
          ${isActive
            ? "-top-2.5 text-[11px] text-[#1F6F78]"
            : "top-2 text-[13px] text-[#6F6E69]"
          }
        `}
      >
        {label}
      </label>

      {isPassword && (
        <div
          className="absolute right-0 top-2 cursor-pointer text-[#6F6E69]"
          onClick={() => setShowPassword((prev) => !prev)}
            >
            {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
        </div>
      )}
    </div>
  );
};

export default Input;