import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuChevronDown, LuCheck } from "react-icons/lu";

const MemberRowItem = ({
  user,
  currentUser,
  onRoleChange,
  onOpenEdit,
  onRemove,
  getInitials,
  getTaskStats,
}) => {
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const stats = getTaskStats(user);
  const isSelf = currentUser && (currentUser._id === user._id || currentUser.email === user.email);
  const canEdit = currentUser && (
    currentUser.role === "ceo" ||
    (currentUser.role === "admin" && (isSelf || user.role === "member"))
  );

  return (
    <div
      className={`
        p-4 rounded-xl
        bg-[var(--surface)]
        border border-[var(--border)]
        shadow-sm
        hover:border-[var(--accent)]
        hover:shadow-md
        transition-all duration-200
        flex flex-col gap-3
        sm:flex-row sm:items-center sm:justify-between sm:gap-4
        relative overflow-visible
        ${isOpen ? "z-10" : "z-0"}
      `}
    >
      {/* Left section: Avatar & Info */}
      <div className="flex items-start gap-3.5 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[var(--bg-soft)] flex items-center justify-center text-xs font-semibold text-[var(--text)] overflow-hidden shrink-0 border border-[var(--border)] shadow-sm">
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            getInitials(user.name || "U")
          )}
        </div>

        {/* Name, Email, and Skills */}
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-[14px] font-semibold text-[var(--text)] truncate">
            {user.name || "Unnamed"} {isSelf && "(You)"}
          </span>
          <span className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">
            {user.email}
          </span>

          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Stats & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t border-[var(--border)] pt-3 sm:border-none sm:pt-0">
        {/* Stats */}
        <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)] font-medium">
          <span>
            Total: <span className="text-[var(--text)] font-semibold">{stats.total}</span>
          </span>
          <span className="flex items-center gap-0.5 text-green-500">
            ✓ <span className="text-[var(--text)] font-semibold">{stats.completed}</span>
          </span>
          <span className="flex items-center gap-0.5 text-cyan-500">
            ↻ <span className="text-[var(--text)] font-semibold">{stats.inProgress}</span>
          </span>
          <span className="flex items-center gap-0.5 text-yellow-500">
            • <span className="text-[var(--text)] font-semibold">{stats.pending}</span>
          </span>
        </div>

        {/* Role and Delete buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {user.role === "ceo" ? (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 shadow-sm">
                CEO
              </span>
            ) : currentUser?.role === "ceo" && !isSelf ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                    bg-[var(--bg-soft)] border border-[var(--border)] 
                    rounded-xl text-[var(--text)]
                    hover:border-[var(--accent)]
                    focus:outline-none focus:border-[var(--accent)]
                    transition-all duration-150
                    cursor-pointer select-none
                  "
                >
                  <span className="capitalize">{user.role || "member"}</span>
                  <LuChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180 text-[var(--accent)]" : ""}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="
                        absolute right-0 mt-1.5 w-32 rounded-xl
                        bg-[var(--surface)] border border-[var(--border)]
                        shadow-lg py-1 z-[100] overflow-hidden
                      "
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onRoleChange(user, "member");
                          setIsOpen(false);
                        }}
                        className="
                          w-full flex items-center justify-between px-3 py-2 text-left
                          hover:bg-[var(--bg-soft)] transition-colors duration-150
                          cursor-pointer group
                        "
                      >
                        <span className="text-xs font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                          Member
                        </span>
                        {(user.role || "member") === "member" && (
                          <LuCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 ml-2" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onRoleChange(user, "admin");
                          setIsOpen(false);
                        }}
                        className="
                          w-full flex items-center justify-between px-3 py-2 text-left
                          hover:bg-[var(--bg-soft)] transition-colors duration-150
                          cursor-pointer group
                        "
                      >
                        <span className="text-xs font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                          Admin
                        </span>
                        {user.role === "admin" && (
                          <LuCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 ml-2" />
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : user.role === "admin" ? (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-sm">
                Admin
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--border)] shadow-sm">
                Member
              </span>
            )}
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit(user);
              }}
              className="
                p-1.5 rounded-lg
                text-[var(--text-muted)]
                hover:text-[var(--accent)]
                transition-all duration-200
                active:scale-[0.95]
                shrink-0
                cursor-pointer
              "
              title="Edit member"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
              </svg>
            </button>
          )}

          {!isSelf && user.role !== "ceo" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(user);
              }}
              className="
                p-1.5 rounded-lg
                text-[var(--text-muted)]
                hover:text-red-500
                transition-all duration-200
                active:scale-[0.95]
                shrink-0
                cursor-pointer
              "
              title="Remove member"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberRowItem;
