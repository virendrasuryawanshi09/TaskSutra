import React, { useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import toast from "react-hot-toast";
import MyTasksWorkspace from "./components/MyTasksWorkspace";
import TaskQuickViewPanel from "./components/TaskQuickViewPanel";
import TaskDiscussionPanel from "../Tasks/TaskDiscussionPanel";
import { io } from "socket.io-client";
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
  const { user, updateUser } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(getInitialTab(new URLSearchParams(location.search).get("view")));
  const [selectedTask, setSelectedTask] = useState(null);
  const [discussionTask, setDiscussionTask] = useState(null);
  const [sortBy, setSortBy] = useState("custom");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [taskOrder, setTaskOrder] = useState([]);
  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [discussionMessages, setDiscussionMessages] = useState([]);
  const [discussionInput, setDiscussionInput] = useState("");
  const socketRef = useRef(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
      const nextTasks = Array.isArray(response?.data?.tasks) ? response.data.tasks : [];
      setTasks(nextTasks);
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
          const nextTasks = Array.isArray(response?.data?.tasks) ? response.data.tasks : [];
          setTasks(nextTasks);
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

  useEffect(() => {
    if (tasks.length === 0) return;

    let savedOrder = [];
    if (user?.taskOrder && user.taskOrder.length > 0) {
      savedOrder = user.taskOrder;
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          savedOrder = parsed?.taskOrder || [];
        } catch (err) {
          console.error(err);
        }
      }
    }

    const allFetchedIds = tasks.map((task) => task._id || task.id).filter(Boolean);
    const savedOrderFiltered = savedOrder.filter((id) => allFetchedIds.includes(id));
    const newIds = allFetchedIds.filter((id) => !savedOrderFiltered.includes(id));
    const nextOrder = [...savedOrderFiltered, ...newIds];

    setTaskOrder((currentOrder) => {
      const isIdentical = currentOrder.length === nextOrder.length && 
                          currentOrder.every((val, i) => val === nextOrder[i]);
      if (isIdentical) return currentOrder;
      return nextOrder;
    });
  }, [user?.taskOrder, tasks]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    socketRef.current = io("http://localhost:5000", {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current.on("task_sync", ({ action, task, taskId }) => {
      if (action === "create") {
        setTasks((prev) => {
          const id = task._id || task.id;
          if (prev.some((t) => (t._id || t.id) === id)) return prev;
          return [task, ...prev];
        });
      } else if (action === "update") {
        setTasks((prev) => {
          const id = task._id || task.id;
          return prev.map((t) => ((t._id || t.id) === id ? task : t));
        });
      } else if (action === "delete") {
        setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!discussionTask || !socketRef.current) return;
    
    const taskId = discussionTask.id || discussionTask._id;

    const fetchDiscussion = async () => {
      try {
        const response = await axiosInstance.get(`/api/task-discussions/${taskId}`);
        if (response.data && response.data.messages) {
          const formattedMessages = response.data.messages.map(msg => ({
            id: msg._id,
            senderId: msg.sender?._id || msg.sender,
            user: msg.sender?.name || "Team Member",
            message: msg.content,
            isEdited: msg.isEdited,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setDiscussionMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching discussion", error);
      }
    };
    fetchDiscussion();

    socketRef.current.emit("joinTaskRoom", taskId);

    const handleReceiveMessage = (msgData) => {
       setDiscussionMessages((prev) => {
          if (prev.find(m => m.id === msgData._id)) return prev;
          
          return [...prev, {
            id: msgData._id,
            senderId: msgData.sender?._id || msgData.sender,
            user: msgData.sender?.name || "Team Member",
            message: msgData.content,
            isEdited: msgData.isEdited,
            timestamp: new Date(msgData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
       });
    };

    const handleEditMessage = (msgData) => {
       setDiscussionMessages((prev) =>
          prev.map(m => m.id === msgData._id ? { ...m, message: msgData.content, isEdited: msgData.isEdited } : m)
       );
    };

    const handleDeleteMessage = (data) => {
       setDiscussionMessages((prev) => prev.filter(m => m.id !== data.messageId));
    };

    socketRef.current.on('receive_task_message', handleReceiveMessage);
    socketRef.current.on('receive_edit_task_message', handleEditMessage);
    socketRef.current.on('receive_delete_task_message', handleDeleteMessage);

    return () => {
       if (socketRef.current) {
           socketRef.current.emit("leaveTaskRoom", taskId);
           socketRef.current.off('receive_task_message', handleReceiveMessage);
           socketRef.current.off('receive_edit_task_message', handleEditMessage);
           socketRef.current.off('receive_delete_task_message', handleDeleteMessage);
       }
       setDiscussionMessages([]);
       setDiscussionInput("");
    };
  }, [discussionTask]);

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

  const handleDiscussionClick = (task) => {
    setDiscussionTask(task);
  };

  const handleSendDiscussionMessage = async () => {
    const trimmedMessage = discussionInput.trim();
    if (!trimmedMessage || !discussionTask) return;

    const taskId = discussionTask.id || discussionTask._id;

    try {
      const response = await axiosInstance.post(`/api/task-discussions/${taskId}`, {
        content: trimmedMessage
      });
      
      const savedMessage = response.data.message;
      
      const newMsg = {
         id: savedMessage._id,
         senderId: user?._id || user?.id,
         user: "You",
         message: savedMessage.content,
         isEdited: savedMessage.isEdited,
         timestamp: new Date(savedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setDiscussionMessages(prev => [...prev, newMsg]);
      setDiscussionInput("");
      
      if (socketRef.current) {
        socketRef.current.emit("send_task_message", {
          taskId,
          messageData: savedMessage
        });
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleEditDiscussionMessage = async (messageId, newContent) => {
    try {
      const response = await axiosInstance.put(`/api/task-discussions/message/${messageId}`, {
        content: newContent
      });
      const updatedMessage = response.data.message;

      setDiscussionMessages(prev => prev.map(m => m.id === messageId ? {
        ...m,
        message: updatedMessage.content,
        isEdited: true
      } : m));

      if (socketRef.current) {
        socketRef.current.emit("edit_task_message", {
          taskId: discussionTask.id || discussionTask._id,
          messageData: updatedMessage
        });
      }
      toast.success("Comment updated");
    } catch (error) {
      toast.error("Failed to edit comment");
    }
  };

  const handleDeleteDiscussionMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/api/task-discussions/message/${messageId}`);

      setDiscussionMessages(prev => prev.filter(m => m.id !== messageId));

      if (socketRef.current) {
        socketRef.current.emit("delete_task_message", {
          taskId: discussionTask.id || discussionTask._id,
          messageId
        });
      }
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
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

  const handlePriorityChange = async (task, nextPriority) => {
    if (!task?.id || task.priority === nextPriority) {
      return;
    }

    setUpdatingTaskId(task.id);
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        (currentTask._id || currentTask.id) === task.id
          ? { ...currentTask, priority: nextPriority }
          : currentTask
      )
    );

    try {
      const response = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK(task.id),
        { priority: nextPriority }
      );
      const updatedTask = response.data?.task;

      if (updatedTask) {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            (currentTask._id || currentTask.id) === task.id ? updatedTask : currentTask
          )
        );
      }

      toast.success("Priority updated.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update priority.");
      loadTasks();
    } finally {
      setUpdatingTaskId("");
    }
  };

  const handleDueDateChange = async (task, nextDate) => {
    if (!task?.id) return;
    
    setUpdatingTaskId(task.id);
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        (currentTask._id || currentTask.id) === task.id
          ? { ...currentTask, dueDate: nextDate, dueDateValue: new Date(nextDate) }
          : currentTask
      )
    );

    try {
      const response = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK(task.id),
        { dueDate: nextDate }
      );
      const updatedTask = response.data?.task;

      if (updatedTask) {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            (currentTask._id || currentTask.id) === task.id ? updatedTask : currentTask
          )
        );
      }

      toast.success("Due date updated.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update due date.");
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

  const handleDragEnd = async () => {
    setDraggedTaskId("");
    setSortBy("custom");

    try {
      const response = await axiosInstance.put("/api/users/reorder-tasks", {
        taskOrder: taskOrder,
      });
      if (response.data && response.data.success) {
        updateUser({
          ...user,
          taskOrder: response.data.taskOrder,
        });
      }
    } catch (error) {
      console.error("Failed to save task order:", error);
      toast.error("Failed to persist task reordering.");
    }
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
        onDiscussionClick={handleDiscussionClick}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onDueDateChange={handleDueDateChange}
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
      <TaskDiscussionPanel
        task={discussionTask}
        isOpen={Boolean(discussionTask)}
        onClose={() => setDiscussionTask(null)}
        messages={discussionMessages}
        queryInput={discussionInput}
        onQueryInputChange={(e) => setDiscussionInput(e.target.value)}
        onSend={handleSendDiscussionMessage}
        onEditMessage={handleEditDiscussionMessage}
        onDeleteMessage={handleDeleteDiscussionMessage}
        currentUser={user}
      />
    </DashboardLayout>
  );
};

export default MyTasksPage;
