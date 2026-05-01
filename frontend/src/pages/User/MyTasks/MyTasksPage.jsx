import React, { useContext, useEffect, useMemo, useState } from "react";
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
import MyTasksSectionHeader from "./components/MyTasksSectionHeader";
import MyTasksSurface from "./components/MyTasksSurface";
import {
  TASK_TABS,
  buildTaskViewModel,
  filterTasksByTab,
  formatTaskDate,
  getInitialTab,
  getTaskCounts,
  getTimeGreeting,
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
  const [activeTab, setActiveTab] = useState(getInitialTab(new URLSearchParams(location.search).get("view")));

  useEffect(() => {
    setActiveTab(getInitialTab(new URLSearchParams(location.search).get("view")));
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
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

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const taskViewModel = useMemo(
    () => tasks.map((task) => buildTaskViewModel(task)),
    [tasks]
  );

  const taskCounts = useMemo(() => getTaskCounts(taskViewModel), [taskViewModel]);
  const visibleTasks = useMemo(
    () => filterTasksByTab(taskViewModel, activeTab),
    [activeTab, taskViewModel]
  );

  const activeTabLabel =
    TASK_TABS.find((tab) => tab.key === activeTab)?.label || "All Tasks";

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <MyTasksSurface className="overflow-hidden">
          <div className="border-b border-[var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(31,111,120,0.08),transparent_42%),var(--surface)] px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {getTimeGreeting()}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                  {user?.name ? `${user.name}, here is everything moving across your queue.` : "My Tasks"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)] sm:text-[15px]">
                  A focused task workspace for reviewing priorities, tracking momentum,
                  and moving through assigned work without losing context.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {overviewCardConfig.map(({ key, label, icon: Icon }) => (
                  <motion.div
                    key={key}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="min-w-[128px] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/92 px-4 py-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {label}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[var(--accent)]">
                        <Icon className="text-base" />
                      </span>
                    </div>

                    <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)]">
                      {taskCounts[key]}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)]/45 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Foundation
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                The premium task controls, segmented filters, and recruiter-facing card
                layout land in the next commits on top of this structure.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)]/45 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Active View
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--text)]">
                {activeTabLabel}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {loading ? "Loading your task list..." : `${visibleTasks.length} tasks visible`}
              </p>
            </div>
          </div>
        </MyTasksSurface>

        <MyTasksSurface className="overflow-hidden">
          <MyTasksSectionHeader
            eyebrow="Task Workspace"
            title="Structured for a premium task flow"
            description="This page is now using a modular page shell, normalized task data, and segmented state so the visual system can scale cleanly in the next commits."
          />

          <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Upcoming surface
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                Search, sort, segmented tabs, and a floating create action will sit here
                without disturbing the overall dashboard rhythm.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Data snapshot
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                Latest due date:{" "}
                <span className="font-medium text-[var(--text)]">
                  {visibleTasks[0]?.dueDateValue
                    ? formatTaskDate(visibleTasks[0].dueDateValue, { year: "numeric" })
                    : "--"}
                </span>
              </p>
            </div>
          </div>
        </MyTasksSurface>
      </div>
    </DashboardLayout>
  );
};

export default MyTasksPage;
