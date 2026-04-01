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
        <div className="flex w-full items-start">

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0">
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
