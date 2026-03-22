import React from "react";


const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">

      <div className="max-w-[1100px] mx-auto min-h-screen flex items-center justify-center px-6 md:grid md:grid-cols-[1.2fr_1fr] md:gap-[80px] relative">

        {/* Divider */}
        <div className="hidden md:block absolute left-1/2 top-[20%] bottom-[20%] w-px bg-[var(--border)]" />

        {/* LEFT */}
        <div className="hidden md:block max-w-[460px]">
          <div className="text-[24px] font-bold mb-[46px] tracking-tight">
            TaskSutra
          </div>

          <div className="text-[28px] md:text-[42px] font-medium leading-[1.2]">
            Work smarter.<br />
            Not harder.<br />
            <span className="block text-[32px] md:text-[46px] text-[var(--accent)] font-bold mt-1">
              Organize everything.
            </span>
          </div>

          <p className="mt-6 text-[15px] text-[var(--text-muted)] leading-[1.6]">
            AI-powered task management system for clarity and execution.
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex justify-start">
          <div className="w-full max-w-[360px] mx-auto md:mx-0">

            <div className="text-[20px] font-semibold mb-[25px]">
              {title}
            </div>
            <div className="auth-fade">
              {children}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;