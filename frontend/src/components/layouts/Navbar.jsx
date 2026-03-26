import React, { useState, useEffect } from "react";
import SideMenu from "./SideMenu";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
    const [openSideMenu, setOpenSideMenu] = useState(false);

    useEffect(() => {
        document.body.style.overflow = openSideMenu ? "hidden" : "auto";
    }, [openSideMenu]);
    useEffect(() => {
        const handleClose = () => setOpenSideMenu(false);

        window.addEventListener("closeSidebar", handleClose);

        return () => {
            window.removeEventListener("closeSidebar", handleClose);
        };
    }, []);
    return (
        <div className="w-full flex items-center justify-between px-6 py-3 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-40">

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

            {/* MOBILE SIDEBAR */}
            <AnimatePresence>
                {openSideMenu && (
                    <>
                        {/* OVERLAY */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                            onClick={() => setOpenSideMenu(false)}
                        />

                        {/* SIDEBAR */}
                        <motion.div
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ duration: 0.3 }}
                            className="fixed top-0 left-0 h-screen w-[260px] z-50"
                        >
                            <SideMenu />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Navbar;