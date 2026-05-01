import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  HiArrowTrendingUp,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
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
    label: "Assigned",
    icon: HiOutlineClipboardDocumentList,
  },
  {
    key: "in-progress",
    label: "In Progress",
    icon: HiArrowTrendingUp,
  },
  {
    key: "completed",
    label: "Completed",
    icon: HiOutlineCheckCircle,
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: HiOutlineCalendarDays,
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
        <MyTasksSurface className="overflow-hidden">
          <MyTasksHeader
            user={user}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddTask={() => {}}
          />

          <div className="grid grid-cols-2 gap-3 border-b border-[var(--border)] px-5 py-5 sm:grid-cols-4 sm:px-6">
            {overviewCardConfig.map(({ key, label, icon: Icon }) => (
              <motion.div
                key={key}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)]/45 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase text-[var(--text-muted)]">
                    {label}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--accent)]">
                    <Icon className="text-base" />
                  </span>
                </div>

                <p className="mt-4 text-2xl font-semibold text-[var(--text)]">
                  {taskCounts[key]}
                </p>
              </motion.div>
            ))}
          </div>
        </MyTasksSurface>

        <MyTasksSurface className="overflow-hidden">
          <MyTasksToolbar
            activeTab={activeTab}
            counts={taskCounts}
            resultCount={visibleTasks.length}
            loading={loading}
            onTabChange={setActiveTab}
            onRefresh={loadTasks}
          />

          <MyTasksSectionHeader
            eyebrow="Queue"
            title="Task list preview"
            description="The task card system lands in the next commit. Search and segmented filters are already wired into the data model."
          />

          <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5">
              <p className="text-xs uppercase text-[var(--text-muted)]">
                Search
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                {searchQuery ? `Showing results for "${searchQuery}".` : "Search is ready."}
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5">
              <p className="text-xs uppercase text-[var(--text-muted)]">
                Results
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                <span className="font-medium text-[var(--text)]">{visibleTasks.length}</span>{" "}
                tasks match the current view.
              </p>
            </div>
          </div>
        </MyTasksSurface>
      </div>
    </DashboardLayout>
  );
};

export default MyTasksPage;
