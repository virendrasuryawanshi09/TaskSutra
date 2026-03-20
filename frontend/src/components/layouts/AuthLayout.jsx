import React from "react";

const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-[#F5F4F1] text-[#1F1F1D]">

      <div className="max-w-[1100px] mx-auto grid md:grid-cols-[1.2fr_1fr] gap-[80px] min-h-screen items-center px-10 relative">

        {/* Divider */}
        <div className="hidden md:block absolute left-1/2 top-[20%] bottom-[20%] w-px bg-[#D1CEC7]" />

        {/* LEFT */}
        <div className="max-w-[460px]">
          <div className="text-[24px] font-bold mb-[46px] tracking-[-0.3px]">
            TaskSutra
          </div>

          <div className="text-[42px] font-medium leading-[1.15]">
            Work smarter.<br />
            Not harder.<br />
            <span className="block text-[46px] text-[#1F6F78] font-bold tracking-[-0.6px] mt-1">
              Organize everything.
            </span>
          </div>

          <p className="mt-6 text-[15px] text-[#6F6E69] leading-[1.6]">
            An AI-powered task management system designed for clarity, speed, and better execution.
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex justify-start">
          <div className="w-full max-w-[340px]">
            <div className="text-[20px] font-semibold mb-[25px]">
              {title}
            </div>

            {children}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;