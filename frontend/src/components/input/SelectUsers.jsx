import { useEffect, useState } from "react";
import React from 'react'
import axiosInstance from "../../utils/axiosInstance";
import { set } from "react-datepicker/dist/dist/date_utils.js";

const SelectUsers = ({selectedUsers, setSelectedUsers}) => {

  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);

  const getAllUsers = async () => {
    try {
      const resopnse = await axiosInstance.get(API_PATHS.USERS.GET_ALLUSERS);
      setAllUsers(resopnse.data);
    }catch (error) {
      console.error("Error fetching users:", error);
    };
  };

  const toggleUserSelection = (userId) => {
    setTempSelectedUsers((prev) => {
      prev.includes(userId) 
      ? prev.filter((id) => id !== userId)
      : [...prev, userId]
    })
  }

  const handleAssign = () => {
    setSelectedUsers(tempSelectedUsers);
    setIsModalOpen(false);
  }

  const selectedUserAvatars = allUsers
  .filter((user) => selectedUsers.includes(user._id))
  .map((user) => user.profileImageUrl);

  useEffect(() => {
    getAllUsers();
  }, []);

  useEffect(() => {
    if(selectedUsers.length === 0) {
      setTempSelectedUsers([]);
    }

    return () => {};
  }, [selectedUsers]);

  
  return (
    <div>SelectUsers</div>
  )
}

export default SelectUsers