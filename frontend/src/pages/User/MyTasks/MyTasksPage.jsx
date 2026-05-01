import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi2";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import MyTasksHeader from "./components/MyTasksHeader";
import MyTasksSectionHeader from "./components/MyTasksSectionHeader";
import MyTasksSurface from "./components/MyTasksSurface";
import MyTasksToolbar from "./components/MyTasksToolbar";
import {
  buildTaskViewModel,
  filterTasksBySearch,
  filterTasksByTab,
  getInitialTab,
  getTaskCounts,
} from "./myTasks.utils";

const overviewCardConfig = [
  {
    key: "all",
    label: "Total",
    icon: HiArrowTrendingUp,
  },
  {
    key: "in-progress",
    label: "Active",
    icon: HiOutlineClock,
  },
  {
    key: "completed",
    label: "Done",
    icon: HiOutlineCheckCircle,
  },
  {
    key: "overdue",
    label: "Late",
    icon: HiArrowTrendingDown,
  },
];

const MyTasksPage = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(getInitialTab(new URLSearchParams(location.search).get("view")));

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
      setTasks(Array.isArray(response.data?.tasks) ? response.data.tasks : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setActiveTab(getInitialTab(new URLSearchParams(location.search).get("view")));
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialTasks = async () => {
      setLoading(true);

      try {
        const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);

        if (isMounted) {
          setTasks(Array.isArray(response.data?.tasks) ? response.data.tasks : []);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);

        if (isMounted) {
          setTasks([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const taskViewModel = useMemo(
    () => tasks.map((task) => buildTaskViewModel(task)),
    [tasks]
  );

  const taskCounts = useMemo(() => getTaskCounts(taskViewModel), [taskViewModel]);
  const visibleTasks = useMemo(() => {
    const tabFilteredTasks = filterTasksByTab(taskViewModel, activeTab);
    return filterTasksBySearch(tabFilteredTasks, searchQuery);
  }, [activeTab, searchQuery, taskViewModel]);

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <MyTasksSurface className="overflow-hidden shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <MyTasksHeader
            user={user}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddTask={() => {}}
          />
        </MyTasksSurface>

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Focus Rail
            </p>
            <div className="mt-4 divide-y divide-[var(--border)]">
              {overviewCardConfig.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex w-full items-center justify-between gap-3 py-4 text-left transition-colors duration-200 ${
                    activeTab === key ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[var(--accent)]">
                      <Icon className="text-base" />
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                  </span>
                  <span className="text-lg font-semibold">{taskCounts[key]}</span>
                </button>
              ))}
            </div>
          </aside>

          <MyTasksSurface className="overflow-hidden">
            <div className="px-5 py-5 sm:px-6">
              <MyTasksToolbar
                activeTab={activeTab}
                counts={taskCounts}
                resultCount={visibleTasks.length}
                loading={loading}
                onTabChange={setActiveTab}
                onRefresh={loadTasks}
              />
            </div>

            <MyTasksSectionHeader
              eyebrow="Queue"
              title="Task list preview"
              description="Search and segmented filters are wired into the task data. The premium task card system lands in the next commit."
            />

            <div className="px-5 py-5 sm:px-6">
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)]/35 px-4 py-5">
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  {searchQuery ? `Showing results for "${searchQuery}" across this view.` : `${visibleTasks.length} tasks match the current view.`}
                </p>
              </div>
            </div>
          </MyTasksSurface>
          </div>
      </div>
    </DashboardLayout>
  );
};

export default MyTasksPage;
