import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const ManageTasks = () => {

  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');

  const navigate = useNavigate();

  const getAllTasks = async () => {
    try {
      const apiStatus =
        filterStatus === 'All'
          ? ''
          : filterStatus === 'In Progress'
            ? 'In-progress'
            : filterStatus;

      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: apiStatus,
        }
      });

      setAllTasks(response.data?.tasks?.length > 0 ? response.data.tasks : []);

      const statusSummary = response.data?.statusSummary || {};

      const statusArray = [
        {
          label: 'All', count: statusSummary.all || 0
        },
        {
          label: "Pending", count: statusSummary.pendingTasks || 0 
        },
        {
          label: "In Progress", count: statusSummary.inProgressTasks || 0 
        },
        {
          label: "Completed", count: statusSummary.completedTasks || 0
        }
      ];

      setTabs(statusArray);

    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleClick = (taskData) => {
    navigate(`/admin/create-task/`, { state: taskData._id });
  };

  const handleDownloadReport = async () => {

  };

  useEffect(() => {
    getAllTasks();
    return () => {};
  }, [filterStatus]);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="">

      </div>
    </DashboardLayout>
  );
};

export default ManageTasks;
