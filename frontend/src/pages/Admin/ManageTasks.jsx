import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { downloadReport } from '../../utils/downloadReport';
import { LuFileSpreadsheet } from 'react-icons/lu';
import TaskStatusTabs from '../../components/TaskStatusTabs';
import TaskCard from '../../components/Charts/TaskCard';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSocket } from "../../context/SocketContext";
import TaskDiscussionPanel from '../User/Tasks/TaskDiscussionPanel';

const ManageTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isExporting, setIsExporting] = useState(false);

  const [discussionTask, setDiscussionTask] = useState(null);
  const [discussionMessages, setDiscussionMessages] = useState([]);
  const [discussionInput, setDiscussionInput] = useState("");
  const socketRef = React.useRef(null);

  const navigate = useNavigate();

  const handleClick = (task) => {
    navigate(`/admin/tasks/${task._id}`);
  };

  const handleExportTasksReport = async () => {
    const toastId = toast.loading('Preparing tasks report...');

    try {
      setIsExporting(true);
      await downloadReport({
        url: API_PATHS.REPORTS.EXPORT_TASKS,
        fallbackFileName: 'task_report.xlsx',
      });
      toast.success('Tasks report downloaded successfully.', { id: toastId });
    } catch (error) {
      toast.error(
        error?.message ||
        error?.response?.data?.message ||
        'Failed to download tasks report.',
        { id: toastId }
      );
    } finally {
      setIsExporting(false);
    }
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

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    const handleTaskSync = () => {
      getAllTasks();
    };

    socket.on("task_sync", handleTaskSync);

    return () => {
      socket.off("task_sync", handleTaskSync);
    };
  }, [socket, filterStatus]);

  useEffect(() => {
    if (!discussionTask || !socket) return;

    const taskId = discussionTask._id;
    const fetchDiscussion = async () => {
      try {
        const response = await axiosInstance.get(`/api/task-discussions/${taskId}`);
        if (response.data && response.data.messages) {
          const formattedMessages = response.data.messages.map(msg => ({
            id: msg._id,
            user: msg.sender?.name || "Admin",
            message: msg.content,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setDiscussionMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching discussion", error);
      }
    };
    fetchDiscussion();

    socket.emit("joinTaskRoom", taskId);

    const handleReceiveMessage = (msgData) => {
       setDiscussionMessages((prev) => {
          if (prev.find(m => m.id === msgData._id)) return prev;
          
          return [...prev, {
            id: msgData._id,
            user: msgData.sender?.name || "Team Member",
            message: msgData.content,
            timestamp: new Date(msgData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
       });
    };

    socket.on('receive_task_message', handleReceiveMessage);

    return () => {
       socket.emit("leaveTaskRoom", taskId);
       socket.off('receive_task_message', handleReceiveMessage);
    };
  }, [discussionTask]);

  const handleSendDiscussionMessage = async () => {
    const trimmedMessage = discussionInput.trim();
    if (!trimmedMessage || !discussionTask) return;

    const taskId = discussionTask._id;
    try {
      const response = await axiosInstance.post(`/api/task-discussions/${taskId}`, {
        content: trimmedMessage
      });
      
      const savedMessage = response.data.message;
      
      const newMsg = {
         id: savedMessage._id,
         user: "You",
         message: savedMessage.content,
         timestamp: new Date(savedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setDiscussionMessages((currentMessages) => [...currentMessages, newMsg]);
      
      if (socketRef.current) {
        socketRef.current.emit("send_task_message", {
           taskId,
           messageData: savedMessage
        });
      }
      
      setDiscussionInput("");
    } catch (error) {
      toast.error("Failed to send message.");
    }
  };

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
            type="button"
            onClick={handleExportTasksReport}
            disabled={isExporting}
            className="
              w-fit
              flex items-center justify-center gap-2
              px-4 py-2.5 text-sm font-medium
              rounded-xl

              bg-[var(--accent)]
              text-white

              shadow-sm
              hover:bg-[var(--accent-hover)]
              disabled:cursor-not-allowed
              disabled:opacity-70
              active:scale-[0.98]

              transition-all duration-200
            "
          >
            <LuFileSpreadsheet />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

        </div>

        {/* 🔥 TABS */}
        <div className="mb-6 -mx-2 px-2">
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
                completedTodoCount={item.completedChecklistCount || 0}
                todoChecklist={item.todoChecklist || []}
                onClick={() => handleClick(item)}
                onDiscussionClick={() => setDiscussionTask(item)}
              />
            ))}

          </div>
        )}

      </div>
      
      <TaskDiscussionPanel
        task={discussionTask}
        isOpen={Boolean(discussionTask)}
        onClose={() => setDiscussionTask(null)}
        messages={discussionMessages}
        queryInput={discussionInput}
        onQueryInputChange={(e) => setDiscussionInput(e.target.value)}
        onSend={handleSendDiscussionMessage}
      />
    </DashboardLayout>
  );
};

export default ManageTasks;
