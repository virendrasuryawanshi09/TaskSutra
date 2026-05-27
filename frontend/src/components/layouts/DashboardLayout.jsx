import React, { useContext } from "react";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import { UserContext } from "../../context/UserContextState";

const DashboardLayout = ({ children, noPaddingMobile = false, hideNavbarMobile = false }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <div className={hideNavbarMobile ? "hidden md:block" : ""}>
        <Navbar />
      </div>

      {user && (
        <div className={`flex ${hideNavbarMobile ? "min-h-screen md:min-h-[calc(100vh-4rem)]" : "min-h-[calc(100vh-4rem)]"} w-full items-stretch`}>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-[260px] lg:flex-shrink-0 lg:border-r lg:border-[var(--border)] lg:bg-[var(--surface)]">
            <SideMenu />
          </div>

          {/* Main Content */}
          <main className={`min-w-0 flex-1 ${noPaddingMobile ? 'p-0 md:p-6 lg:p-8' : 'p-4 md:p-6 lg:p-8'}`}>
            {children}
          </main>

        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
