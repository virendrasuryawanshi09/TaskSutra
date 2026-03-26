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
        <div className="flex">

          {/* Desktop Sidebar */}
          <div className="hidden lg:block h-screen">
            <SideMenu />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </div>

        </div>
      )}
    </div>
  );
};

export default DashboardLayout;