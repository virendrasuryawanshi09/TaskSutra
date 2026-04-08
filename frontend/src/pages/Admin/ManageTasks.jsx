import React, {useEffect, useState} from 'react'
import DashboardLayout from '../../components/Layouts/DashboardLayout'

const ManageTasks = () => {

  const [allTasks, setAllTasks] = useState([]);

  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const navigate = useNavigate();
  const getAllTasks = async () => {

  };

  const handleClick = (taskData) => {
    navigate(`/admin/create-task/`, { state: taskData._id });
  };

  const handleDownloadReport = async () => {

  };

  useEffect(() => {
    getAllTasks();
    return () =>{};
  }, [filterStatus]);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="">

      </div>
    </DashboardLayout>
  )
}

export default ManageTasks