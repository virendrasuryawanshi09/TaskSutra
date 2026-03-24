import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../context/UserContextState'
import { useNavigate } from 'react-router-dom';
import { SIDE_MENU_DATA , SIDE_MENU_USER_DATA} from "../../utils/data"

const SideMenu = ({ activeMenu }) => {
  const { user, clearuser } = useContext(UserContext);
  const [sideMenu, setSideMenu] = useState([]);

  const navigate = useNavigate();

  const handleClick = (route) => {
    if (route === "logout") {
      handleLogout();
      return;
    }
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.clear();
    clearuser();
    navigate("/login");
  };

  useEffect(() => {
    if (user) {
      setSideMenuData(
        user.role === 'admin' ? SIDE_MENU_DATA : SIDE_MENU_USER_DATA
      );
    }
  }, [user]);

  return (
    <div>
      SideMenu
    </div>
  );
};

export default SideMenu;