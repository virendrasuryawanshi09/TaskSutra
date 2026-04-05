import React, { useContext } from "react";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import { UserContext } from "../../context/UserContextState";

const DashboardLayout = ({ children }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      <Navbar />

      {user && (
        <div className="flex min-h-[calc(100vh-4rem)] w-full items-stretch">

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-[260px] lg:flex-shrink-0 lg:border-r lg:border-[var(--border)] lg:bg-[var(--surface)]">
            <SideMenu />
          </div>

          {/* Main Content */}
          <div className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </div>

        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
