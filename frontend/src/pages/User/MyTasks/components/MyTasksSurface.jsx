import React from "react";

const MyTasksSurface = ({ children, className = "" }) => {
  return (
    <section
      className={`rounded-[24px] border border-[var(--border)] bg-[var(--surface)] ${className}`}
    >
      {children}
    </section>
  );
};

export default MyTasksSurface;
