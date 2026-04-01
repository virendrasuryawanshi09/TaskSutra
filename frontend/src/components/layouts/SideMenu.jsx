import React, { useContext, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserContext } from "../../context/UserContextState";
import { useNavigate, useLocation } from "react-router-dom";
import { SIDE_MENU_DATA, SIDE_MENU_USER_DATA } from "../../utils/data";
import { HiOutlineX } from "react-icons/hi";

const SideMenu = () => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  const sideMenuData = user
    ? user.role === "admin"
      ? SIDE_MENU_DATA
      : SIDE_MENU_USER_DATA
    : [];

  const userInitial = useMemo(() => {
    const name = user?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : "U";
  }, [user?.name]);

  const handleClick = (route) => {
    if (route === "logout") {
      localStorage.clear();
      clearUser();
      navigate("/login");
    } else {
      navigate(route);
    }
  };


  return (
    <div className="flex h-full min-h-full w-[260px] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] p-4">

      <div className="mb-2 flex items-center justify-between lg:hidden">

        {/* LOGO */}
        <h2 className=" lg:hidden text-[16px] font-bold tracking-tight">
          Task<span className="text-[var(--accent)]">Sutra</span>
        </h2>

        {/* CLOSE BUTTON (MOBILE ONLY) */}
        <button
          onClick={() => window.dispatchEvent(new Event("closeSidebar"))}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-soft)] transition"
        >
          <HiOutlineX className="text-[20px]" />
        </button>
      </div>

      {/* PROFILE */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="mb-8 flex flex-col items-center text-center lg:pt-2"
      >
        {/* IMAGE */}
        {user?.profileImageUrl && !imageError ? (
          <img
            src={user.profileImageUrl}
            alt={user?.name || "User"}
            onError={() => setImageError(true)}
            className="
              w-16 h-16 rounded-full mb-3
              object-cover
              border border-[var(--border)]
            "
          />
        ) : (
          <div
            className="
              w-16 h-16 rounded-full mb-3
              border border-[var(--border)]
              bg-[var(--bg-soft)] text-[var(--accent)]
              flex items-center justify-center text-lg font-semibold
            "
          >
            {userInitial}
          </div>
        )}

        {/* ROLE */}
        {user?.role === "admin" && (
          <span className="text-[11px] text-[var(--accent)] font-medium mb-1">
            Admin
          </span>
        )}

        {/* NAME */}
        <div className="text-sm font-semibold">
          {user?.name || "User"}
        </div>

        {/* EMAIL */}
        <div className="text-xs text-[var(--text-muted)] mt-1">
          {user?.email || ""}
        </div>
      </motion.div>

      {/* MENU */}
      <div className="flex flex-1 flex-col gap-1 pb-4">
        {sideMenuData.map((item, index) => {
          const isActive = location.pathname.startsWith(item.path);
          const isLogout = item.path === "logout";

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: isActive ? 1 : 1.02 }}
              onClick={() => handleClick(item.path)}
              className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm transition-all duration-200

                ${isActive
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : isLogout
                    ? "text-[var(--text-muted)] hover:bg-[rgba(220,38,38,0.08)] hover:text-[#B42318]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                }
              `}
            >
              {/* ACTIVE INDICATOR */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-[var(--accent)]"
                />
              )}

              {/* ICON */}
              <div
                className={`
                  w-8 h-8 flex items-center justify-center rounded-lg transition
                  ${isActive
                    ? "bg-[var(--accent-soft)]"
                    : isLogout
                      ? "bg-[var(--bg-soft)] group-hover:scale-105 group-hover:bg-[rgba(220,38,38,0.12)]"
                      : "bg-[var(--bg-soft)] group-hover:scale-105"
                  }
                `}
              >
                <item.icon className="text-[16px]" />
              </div>

              {item.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SideMenu;
