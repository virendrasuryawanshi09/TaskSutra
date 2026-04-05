import React, { useState, useEffect } from "react";
import SideMenu from "./SideMenu";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const Navbar = () => {
    const [openSideMenu, setOpenSideMenu] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (openSideMenu) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
            document.body.style.overflowY = "scroll";
        }

        return () => {
            document.body.style.overflow = "";
            document.body.style.overflowY = "";
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
