import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { LuFileSpreadsheet } from 'react-icons/lu';
import TaskStatusTabs from '../../components/TaskStatusTabs';

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
        params: { status: apiStatus },
      });

      setAllTasks(response.data?.tasks || []);

      const statusSummary = response.data?.statusSummary || {};

      setTabs([
        { label: 'All', count: statusSummary.allTasks || 0 },
        { label: 'Pending', count: statusSummary.pendingTasks || 0 },
        { label: 'In Progress', count: statusSummary.inProgressTasks || 0 },
        { label: 'Completed', count: statusSummary.completedTasks || 0 },
      ]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleDownloadReport = async () => {};

  useEffect(() => {
    getAllTasks();
  }, [filterStatus]);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div
        className="
        relative
        w-full
        sm:max-w-6xl sm:mx-auto
        px-3 sm:px-4
        py-6 sm:py-10
      "
      >
        {/* 🔥 BACKGROUND GLOW */}
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl bg-[radial-gradient(circle_at_top,rgba(58,166,176,0.15),transparent_60%)]" />

        {/* 🔥 HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight">
              My Tasks
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Manage and monitor your workflow efficiently
            </p>
          </div>

          <button
            onClick={handleDownloadReport}
            className="
              w-full sm:w-auto
              flex items-center justify-center gap-2
              px-4 py-2.5 text-sm font-medium
              rounded-xl

              bg-[var(--accent)]
              text-white

              shadow-sm
              hover:bg-[var(--accent-hover)]
              active:scale-[0.98]

              transition-all duration-200
            "
          >
            <LuFileSpreadsheet className="text-base" />
            Export
          </button>
        </div>

        {/* 🔥 MAIN PANEL */}
        <div
          className="
          w-full
          bg-[var(--surface)]
          border border-[var(--border)]
          rounded-2xl

          px-3 sm:px-6 py-4 sm:py-6

          shadow-[0_8px_25px_rgba(0,0,0,0.05)]
          backdrop-blur-sm
        "
        >
          <div className="space-y-5 sm:space-y-6">
            {/* 🔥 TABS */}
            <div className="overflow-x-auto -mx-2 px-2">
              <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />
            </div>

            {/* 🔥 CONTENT */}
            <div
              className="
              min-h-[220px] sm:min-h-[280px]
              flex items-center justify-center
              text-center sm:text-left
            "
            >
              <p className="text-sm text-[var(--text-muted)]">
                Your tasks will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageTasks;