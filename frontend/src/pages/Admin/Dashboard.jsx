import React, { useState, useContext, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/UserContextState';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';
import { addThousandSeparator } from '../../utils/helper';
import InfoCard from '../../components/Cards/InfoCard';
import { HiOutlineCheckCircle, HiOutlineClipboardList, HiOutlineClock, HiOutlineRefresh } from 'react-icons/hi';
import { LuArrowRight } from 'react-icons/lu';
import TaskListTable from '../../components/TaskListTable';
import CustomPieChart from '../../components/Charts/CustomPieChart';


const COLORS = [
  "#D97706", // Pending
  "#2F7A84", // In Progress
  "#4C7F6A", // Completed
];


const Dashboard = () => {

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  const prepareChartData = (data) => {
    const taskDistribution = data?.taskDistribution || {};
    const taskPriorityLevels = data?.taskPriorityLevels || {};
    const totalTasks = Number(taskDistribution?.All || 0);
    const pendingTasks = Number(taskDistribution?.Pending || 0);
    const completedTasks = Number(taskDistribution?.Completed || 0);
    const rawInProgressCount = Number(
      taskDistribution?.InProgress ??
      taskDistribution?.["In Progress"] ??
      taskDistribution?.["In-progress"] ??
      0
    );
    const derivedInProgressCount = Math.max(
      0,
      totalTasks - pendingTasks - completedTasks
    );
    const inProgressCount = rawInProgressCount || derivedInProgressCount;

    const taskDistributionData = [
      { status: "Pending", count: pendingTasks },
      { status: "In Progress", count: inProgressCount },
      { status: "Completed", count: completedTasks },
    ];

    setPieChartData(taskDistributionData);

    const priorityLevelData = [
      { priority: "High", count: taskPriorityLevels?.High || 0 },
      { priority: "Medium", count: taskPriorityLevels?.Medium || 0 },
      { priority: "Low", count: taskPriorityLevels?.Low || 0 },
    ];
    setBarChartData(priorityLevelData);
  };

  const getDashboardData = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_DASHBOARD_DATA
      );

      if (response.data) {
        setDashboardData(response.data);
        prepareChartData(response.data?.charts || null);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const onSeeMore = () => {
    navigate("/admin/tasks");
  };

  // ✅ CORRECT PLACE
  useEffect(() => {
    getDashboardData();
  }, []);

  if (!dashboardData) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <div className="p-6 text-[var(--text-muted)]">
          Loading dashboard...
        </div>
      </DashboardLayout>
    );
  }

  const taskDistribution = dashboardData?.charts?.taskDistribution || {};
  const totalTasks = Number(taskDistribution?.All || 0);
  const pendingTasks = Number(taskDistribution?.Pending || 0);
  const completedTasks = Number(taskDistribution?.Completed || 0);
  const rawInProgressCount = Number(
    taskDistribution?.InProgress ??
    taskDistribution?.["In Progress"] ??
    taskDistribution?.["In-progress"] ??
    0
  );
  const inProgressCount = rawInProgressCount || Math.max(
    0,
    totalTasks - pendingTasks - completedTasks
  );

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:my-6 sm:p-5">
        <div>
          <div className="col-span-3">
            <h2 className="text-[28px] font-semibold leading-tight text-[var(--text)] tracking-tight sm:text-2xl md:text-3xl">
              Good Morning, {user?.name}
            </h2>

            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {moment().format("dddd, MMMM Do YYYY")}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 md:grid-cols-4 md:gap-6">
          <InfoCard
            label="Total Tasks"
            icon={<HiOutlineClipboardList />}
            value={addThousandSeparator(totalTasks)}
            color="#4F46E5"
          />

          <InfoCard
            label="Pending Tasks"
            icon={<HiOutlineClock />}
            value={addThousandSeparator(pendingTasks)}
            color="#D97706"
          />

          <InfoCard
            label="In Progress Tasks"
            icon={<HiOutlineRefresh />}
            value={addThousandSeparator(inProgressCount)}
            color="#059669"
          />
          <InfoCard
            label="Completed Tasks"
            icon={<HiOutlineCheckCircle />}
            value={addThousandSeparator(completedTasks)}
            color="#2563EB"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">


        <div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Task Distribution</h5>
            </div>

            <CustomPieChart
              data={pieChartData}
              colors={COLORS}
            />
          </div>
        </div>

        <div className="md:col-span-2">

          <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-white/40 to-white/10">

            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-300 p-5">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">

                <div>
                  <h5 className="text-lg font-semibold text-[var(--text)]">
                    Recent Tasks
                  </h5>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Track your latest activity
                  </p>
                </div>

                <button
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition cursor-pointer"
                  onClick={onSeeMore}
                >
                  View All
                  <LuArrowRight className="text-base transition-transform duration-200 group-hover:translate-x-1" />
                </button>

              </div>

              <div className="h-px bg-[var(--border)] mb-4"></div>

              <TaskListTable tableData={dashboardData?.recentTasks || []} />

            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
