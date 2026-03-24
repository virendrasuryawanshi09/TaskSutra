import React from 'react'
import Navbar from './Navbar'
import SideMenu from './SideMenu'
import useUserAuth from '../../hooks/useUserAuth.jsx'

const DashboardLayout = ({ children, activeMenu }) => {
    const { user } = useUserAuth();
    return (
        <div className="">
            <Navbar activeMenu={activeMenu} />
        

    {
        user && (
            <div className="flex">
                <div className="max-[1080px]: hidden">
                    <SideMenu activeMenu={activeMenu} />
                </div>

                <div className="grow mx-5"></div>
            </div>
        )
    }
    </div>
  )
}

export default DashboardLayout
