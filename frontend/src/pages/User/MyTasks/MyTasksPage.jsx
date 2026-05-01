import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import toast from "react-hot-toast";
import MyTasksHeader from "./components/MyTasksHeader";
import MyTasksSurface from "./components/MyTasksSurface";
import MyTasksToolbar from "./components/MyTasksToolbar";
import PremiumTaskGrid from "./components/PremiumTaskGrid";
import TaskQuickViewPanel from "./components/TaskQuickViewPanel";
import {
  buildTaskViewModel,
  filterTasksBySearch,
  filterTasksByTab,
  getInitialTab,
  getTaskCounts,
  normalizeTaskStatus,
  sortTasks,
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
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(getInitialTab(new URLSearchParams(location.search).get("view")));
  const [selectedTask, setSelectedTask] = useState(null);
  const [sortBy, setSortBy] = useState("custom");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [taskOrder, setTaskOrder] = useState([]);
  const [draggedTaskId, setDraggedTaskId] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
      const nextTasks = Array.isArray(response.data?.tasks) ? response.data.tasks : [];
      setTasks(nextTasks);
      setTaskOrder(nextTasks.map((task) => task._id || task.id).filter(Boolean));
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
          const nextTasks = Array.isArray(response.data?.tasks) ? response.data.tasks : [];
          setTasks(nextTasks);
          setTaskOrder(nextTasks.map((task) => task._id || task.id).filter(Boolean));
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
    () => {
      const rank = new Map(taskOrder.map((taskId, index) => [taskId, index]));
      return tasks
        .map((task) => buildTaskViewModel(task))
        .sort((leftTask, rightTask) => {
          const leftRank = rank.get(leftTask.id) ?? Number.MAX_SAFE_INTEGER;
          const rightRank = rank.get(rightTask.id) ?? Number.MAX_SAFE_INTEGER;
          return leftRank - rightRank;
        });
    },
    [taskOrder, tasks]
  );

  const taskCounts = useMemo(() => getTaskCounts(taskViewModel), [taskViewModel]);
  const visibleTasks = useMemo(() => {
    const tabFilteredTasks = filterTasksByTab(taskViewModel, activeTab);
    const searchedTasks = filterTasksBySearch(tabFilteredTasks, searchQuery);
    return sortTasks(searchedTasks, sortBy);
  }, [activeTab, searchQuery, sortBy, taskViewModel]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleOpenFullTask = (task) => {
    if (!task?.id) return;
    navigate(`/user/task-details/${task.id}`, {
      state: {
        from: "/user/my-tasks",
      },
    });
  };

  const handleStatusChange = async (task, nextStatus) => {
    const normalizedStatus = normalizeTaskStatus(nextStatus);

    if (!task?.id || task.status === normalizedStatus) {
      return;
    }

    setUpdatingTaskId(task.id);
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        (currentTask._id || currentTask.id) === task.id
          ? { ...currentTask, status: normalizedStatus }
          : currentTask
      )
    );

    try {
      const response = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK_STATUS(task.id),
        { status: normalizedStatus }
      );
      const updatedTask = response.data?.task;

      if (updatedTask) {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            (currentTask._id || currentTask.id) === task.id ? updatedTask : currentTask
          )
        );
      }

      toast.success("Status updated.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update status.");
      loadTasks();
    } finally {
      setUpdatingTaskId("");
    }
  };

  const handleDragStart = (event, taskId) => {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (event, targetTaskId) => {
    event.preventDefault();

    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      return;
    }

    setTaskOrder((currentOrder) => {
      const nextOrder = [...currentOrder];
      const draggedIndex = nextOrder.indexOf(draggedTaskId);
      const targetIndex = nextOrder.indexOf(targetTaskId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return currentOrder;
      }

      nextOrder.splice(draggedIndex, 1);
      nextOrder.splice(targetIndex, 0, draggedTaskId);
      return nextOrder;
    });
  };

  const handleDragEnd = () => {
    setDraggedTaskId("");
    setSortBy("custom");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <MyTasksSurface className="overflow-hidden shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <MyTasksHeader
            user={user}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
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
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>

            <div className="px-5 py-5 sm:px-6">
              <PremiumTaskGrid
                tasks={visibleTasks}
                loading={loading}
                onTaskClick={handleTaskClick}
                onStatusChange={handleStatusChange}
                updatingTaskId={updatingTaskId}
                canReorder={sortBy === "custom"}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
              />
            </div>
          </MyTasksSurface>
          </div>
      </div>
      <TaskQuickViewPanel
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onOpenTask={handleOpenFullTask}
      />
    </DashboardLayout>
  );
};

export default MyTasksPage;
