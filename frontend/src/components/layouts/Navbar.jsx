import React, { useState, useEffect, useRef, useContext } from "react";
import SideMenu from "./SideMenu";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LuBell, LuTrash2, LuCheck, LuCheckCheck } from "react-icons/lu";
import { useNotification } from "../../context/NotificationContext";
import { UserContext } from "../../context/UserContextState";

const Navbar = () => {
    const [openSideMenu, setOpenSideMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    } = useNotification();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Active notification actions wrappers to stop propagation
    const handleMarkAsRead = (id, e) => {
        if (e) e.stopPropagation();
        markAsRead(id);
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
    };

    const handleDeleteNotification = (id, e) => {
        if (e) e.stopPropagation();
        deleteNotification(id);
    };

    const handleClearAll = () => {
        clearAll();
    };

    const handleNotificationClick = (n) => {
        if (!n.isRead) {
            markAsRead(n._id);
        }
        setIsDropdownOpen(false);

        const role = user?.role || "member";
        const basePath = (role === "admin" || role === "ceo") ? "/admin" : "/user";

        if (n.type === "direct_message") {
            navigate(`${basePath}/direct-chat`, {
                state: { activeUser: n.sender }
            });
        } else if (n.type === "community_chat") {
            navigate(`${basePath}/direct-chat`, {
                state: { activeCommunity: true }
            });
        } else if (n.type === "task_message") {
            navigate(`${basePath}/direct-chat`, {
                state: { activeTask: { _id: n.task?._id || n.task } }
            });
        } else if (n.type === "task_assigned" || n.type === "task_updated") {
            if (role === "admin" || role === "ceo") {
                navigate(`/admin/tasks`);
            } else {
                navigate(`/user/task-details/${n.task?._id || n.task}`);
            }
        }
    };

    useEffect(() => {
        if (openSideMenu) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [openSideMenu]);
    useEffect(() => {
        const handleClose = () => setOpenSideMenu(false);

        window.addEventListener("closeSidebar", handleClose);

        return () => {
            window.removeEventListener("closeSidebar", handleClose);
        };
    }, []);

    useEffect(() => {
        setOpenSideMenu(false);
    }, [location.pathname]);

    return (
        <>
            <div className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-6 backdrop-blur-md">

                <div className="flex items-center gap-3">

                    <button
                        onClick={() => setOpenSideMenu(!openSideMenu)}
                        className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-soft)] transition"
                    >
                        {openSideMenu ? (
                            <HiOutlineX className="text-[20px]" />
                        ) : (
                            <HiOutlineMenu className="text-[20px]" />
                        )}
                    </button>

                    <h2 className="text-[15px] font-bold">
                        Task<span className="text-[var(--accent)]">Sutra</span>
                    </h2>
                </div>

                {/* Right side controls: Notification Bell Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="relative p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-soft)] transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                        <LuBell className="text-[20px]" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-[var(--accent)] shadow-sm" />
                        )}
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-80 max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl z-50 flex flex-col gap-3.5"
                            >
                                {/* Dropdown Header */}
                                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                                    <h3 className="text-sm font-semibold text-[var(--text)]">Notifications</h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-medium transition cursor-pointer"
                                            title="Mark all as read"
                                        >
                                            <LuCheckCheck className="text-sm" />
                                            Read All
                                        </button>
                                        <button 
                                            onClick={handleClearAll}
                                            className="text-xs text-red-500 hover:underline flex items-center gap-1 font-medium transition cursor-pointer"
                                            title="Clear all"
                                        >
                                            <LuTrash2 className="text-sm" />
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                {/* Dropdown Body: Notification List */}
                                <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div
                                                key={n._id}
                                                onClick={() => handleNotificationClick(n)}
                                                className={`p-3 rounded-xl border transition duration-150 flex flex-col gap-1.5 text-left relative group cursor-pointer ${
                                                    n.isRead 
                                                        ? "bg-transparent border-transparent hover:bg-[var(--bg-soft)]" 
                                                        : "bg-[var(--bg-soft)] border-[var(--border)] hover:border-[var(--accent)]"
                                                }`}
                                            >
                                                {/* Top row: Title and Badge/Action */}
                                                <div className="flex items-start justify-between gap-2 min-w-0">
                                                    <span className={`text-xs font-semibold truncate ${
                                                        n.isRead ? "text-[var(--text)]" : "text-[var(--accent)]"
                                                    }`}>
                                                        {n.title}
                                                    </span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {!n.isRead && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Message */}
                                                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                                    {n.message}
                                                </p>

                                                {/* Bottom row: Time and Actions */}
                                                <div className="flex items-center justify-between mt-1 text-[10px] text-[var(--text-muted)]">
                                                    <span>
                                                        {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-2">
                                                        {!n.isRead && (
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(n._id, e)}
                                                                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
                                                                title="Mark as read"
                                                            >
                                                                <LuCheck />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDeleteNotification(n._id, e)}
                                                            className="text-[var(--text-muted)] hover:text-red-500 transition cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <LuTrash2 />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {openSideMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] bg-black/45"
                            onClick={() => setOpenSideMenu(false)}
                        />

                        <motion.div
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-y-0 left-0 z-[90] w-[40vw] min-w-[220px] max-w-[280px] overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.22)]"
                        >
                            <SideMenu />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
