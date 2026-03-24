import React, { useContext, useState } from 'react'
import { UserContext } from '../../context/UserContextState'
import { useNavigate } from 'react-router-dom';

const SideMenu = ({activeMenu}) => {
    const {user, clearuser} = useContext(UserContext);
    const [sideMenu, setSideMenu] = useState([]);

    const navigate = useNavigate();

    

  return (
    <div>SideMenu</div>
  )
}

export default SideMenu