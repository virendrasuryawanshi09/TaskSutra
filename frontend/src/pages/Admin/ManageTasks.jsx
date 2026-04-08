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
        params: {
          status: apiStatus,
        }
      });

      setAllTasks(response.data?.tasks?.length > 0 ? response.data.tasks : []);

      const statusSummary = response.data?.statusSummary || {};

      const statusArray = [
        {
          label: 'All', count: statusSummary.allTasks || 0
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
    return () => { };
  }, [filterStatus]);

 return (
  <DashboardLayout activeMenu="Manage Tasks">
    <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">


      <div className="absolute inset-0 -z-10 opacity-40 blur-3xl bg-[radial-gradient(circle_at_top,rgba(58,166,176,0.15),transparent_60%)]" />

      <div className="space-y-8">

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text)] tracking-tight">
              My Tasks
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Manage and monitor your workflow efficiently
            </p>
          </div>

          <button
            onClick={handleDownloadReport}
            className="
              flex items-center gap-2
              px-4 py-2 text-sm font-medium
              rounded-xl

              bg-[var(--accent)]
              text-white

              shadow-[0_4px_20px_rgba(0,0,0,0.08)]
              hover:shadow-[0_6px_25px_rgba(0,0,0,0.12)]
              hover:scale-[1.02]
              active:scale-[0.98]

              transition-all duration-200
            "
          >
            <LuFileSpreadsheet className="text-base" />
            Export
          </button>

        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {tabs.map((tab) => (
            <div
              key={tab.label}
              onClick={() => setFilterStatus(tab.label)}
              className={`
                cursor-pointer
                rounded-xl p-4
                transition-all duration-300

                ${
                  filterStatus === tab.label
                    ? "bg-[var(--accent)] text-white shadow-md scale-[1.02]"
                    : "bg-[var(--surface)] border border-[var(--border)] hover:shadow-sm hover:border-[var(--text-muted)]"
                }
              `}
            >
              <p className="text-xs opacity-80">{tab.label}</p>
              <p className="text-xl font-semibold mt-1">{tab.count}</p>
            </div>
          ))}

        </div>


        <div className="
          relative
          bg-[var(--surface)]
          border border-[var(--border)]
          rounded-2xl p-6

          shadow-[0_10px_30px_rgba(0,0,0,0.05)]
          backdrop-blur-sm

          transition-all duration-300
        ">

  
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none dark:from-white/5" />


          <div className="relative space-y-6">

  
            <div>
              <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />
            </div>


            <div className="
              flex flex-col items-center justify-center
              py-20 text-center
            ">
              <p className="text-sm text-[var(--text-muted)]">
                Your tasks will appear here
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  </DashboardLayout>
);
};

export default ManageTasks;
