import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import toast from "react-hot-toast";
import MyTasksWorkspace from "./components/MyTasksWorkspace";
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
    const effectiveSort = activeTab === "upcoming" && sortBy === "custom" ? "due-date" : sortBy;
    return sortTasks(searchedTasks, effectiveSort);
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
      <MyTasksWorkspace
        user={user}
        tasks={visibleTasks}
        loading={loading}
        counts={taskCounts}
        activeTab={activeTab}
        searchQuery={searchQuery}
        sortBy={sortBy}
        updatingTaskId={updatingTaskId}
        selectedTaskId={selectedTask?.id || ""}
        canReorder={sortBy === "custom"}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
        onSortChange={setSortBy}
        onRefresh={loadTasks}
        onTaskClick={handleTaskClick}
        onStatusChange={handleStatusChange}
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDragEnd={handleDragEnd}
      />
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
