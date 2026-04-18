import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { LuFileSpreadsheet } from 'react-icons/lu';
import TaskStatusTabs from '../../components/TaskStatusTabs';
import TaskCard from '../../components/Charts/TaskCard';
import { useNavigate } from 'react-router-dom';

const ManageTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');

  const navigate = useNavigate();

  const handleClick = (task) => {
    navigate(`/admin/tasks/${task._id}`);
  };

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
      console.error(error);
    }
  };

  useEffect(() => {
    getAllTasks();
  }, [filterStatus]);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="
        relative
        w-full
        sm:max-w-6xl sm:mx-auto
        px-4 sm:px-6
        py-8 sm:py-12
      ">


        <div className="absolute inset-0 -z-10 opacity-20 blur-3xl bg-[radial-gradient(circle_at_top,rgba(58,166,176,0.2),transparent_60%)]" />

        {/* 🔥 HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">

          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              Tasks
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Manage your workflow efficiently
            </p>
          </div>

          <button
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
            <LuFileSpreadsheet />
            Export
          </button>

        </div>

        {/* 🔥 TABS */}
        <div className="mb-6 overflow-x-auto -mx-2 px-2">
          <TaskStatusTabs
            tabs={tabs}
            activeTab={filterStatus}
            setActiveTab={setFilterStatus}
          />
        </div>

        {/* 🔥 DIVIDER (SUBTLE PREMIUM TOUCH) */}
        <div className="h-px bg-[var(--border)] mb-6 opacity-60" />

        {/* 🔥 CONTENT */}
        {allTasks.length === 0 ? (
          <div className="
            flex flex-col items-center justify-center
            min-h-[260px]
            text-center
          ">
            <p className="text-sm text-[var(--text-muted)]">
              No tasks found
            </p>
          </div>
        ) : (

          <div className="
            grid grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            gap-4 sm:gap-5 lg:gap-6
          ">

            {allTasks.map((item) => (
              <TaskCard
                key={item._id}
                title={item.title}
                description={item.description}
                priority={item.priority}
                status={item.status}
                progress={item.progress}
                createdAt={item.createdAt}
                dueDate={item.dueDate}

                
                assignedTo={item.assignedTo?.map((u) => ({
                  image: u.profileImageUrl,
                  name: u.name || u.email || "User"
                }))}

                attachmentCount={item.attachments?.length || 0}
                completedTodoCount={item.completedTodoCount || 0}
                todoChecklist={item.todoChecklist || []}
                onClick={() => handleClick(item)}
              />
            ))}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ManageTasks;
