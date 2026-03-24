import React, { useState } from "react";
import SideMenu from "./SideMenu";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";

const Navbar = ({ activeMenu }) => {
    const [openSideMenu, setOpenSideMenu] = useState(false);

    return (
        <div
            className="
        w-full flex items-center justify-between
        px-5 py-3
        bg-[var(--surface)] text-[var(--text)]
        border-b border-[var(--border)]
        transition-colors duration-300
      "
        >

            <div className="flex items-center gap-3">

                {/* MENU BUTTON */}
                <button
                    onClick={() => setOpenSideMenu(!openSideMenu)}
                    className="
            p-2 rounded-[8px]
            text-[var(--text-muted)]
            transition-all duration-200
            hover:bg-[var(--bg-soft)]
            active:scale-[0.95]
          "
                >
                    {openSideMenu ? (
                        <HiOutlineX className="text-[20px]" />
                    ) : (
                        <HiOutlineMenu className="text-[20px]" />
                    )}
                </button>

                {/* LOGO */}
                <h2 className="text-[15px] font-bold tracking-tight">
                    Task<span className="text-[var(--accent-hover)]">Sutra</span>
                </h2>

            </div>


            <div className="flex items-center gap-3">

            </div>


            {openSideMenu && (
                <div
                    className="
            fixed inset-0 z-40
            bg-black/20 backdrop-blur-sm
          "
                    onClick={() => setOpenSideMenu(false)}
                >
                    <div
                        className="
              w-[260px] h-full
              bg-[var(--surface)]
              border-r border-[var(--border)]
              shadow-lg
              p-4
            "
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SideMenu activeMenu={activeMenu} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;