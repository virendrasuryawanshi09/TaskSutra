import React, { useContext } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import { UserContext } from "../../context/UserContextState";

const DashboardLayout = ({ children, noPaddingMobile = false, hideNavbarMobile = false }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--text)]">

      {/* Sticky Navbar — always visible at the top */}
      <div className={hideNavbarMobile ? "hidden md:block flex-shrink-0" : "flex-shrink-0"}>
        <Navbar />
      </div>

      {user && (
        <div className="flex flex-1 min-h-0 w-full">

          {/* Desktop Sidebar — full height, no scroll needed */}
          <div className="hidden lg:flex lg:w-[260px] lg:flex-shrink-0 lg:border-r lg:border-[var(--border)] lg:bg-[var(--surface)]">
            <SideMenu />
          </div>

          {/* Main Content — this is the ONLY scrolling area */}
          <main className={`min-w-0 flex-1 overflow-y-auto ${noPaddingMobile ? 'p-0 md:p-6 lg:p-8' : 'p-4 md:p-6 lg:p-8'}`}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>

        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
