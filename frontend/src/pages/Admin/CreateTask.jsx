import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/Layouts/DashboardLayout";
import SelectDropdown from "../../components/input/SelectDropdown"
import { PRIORITY_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LuTrash2 } from "react-icons/lu";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import "./CreateTask.css";
import SelectUsers from "../../components/input/SelectUsers";
import TodoListInput from "../../components/input/TodoListInput";
import AddAttachmentsInput from "../../components/input/AddAttachmentsInput";

const CreateTask = () => {
  const location = useLocation();
  const { id: routeTaskId } = useParams();
  const { taskId: stateTaskId } = location.state || {};
  const taskId = stateTaskId || routeTaskId;
  const navigate = useNavigate();

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "Low",
    dueDate: null,
    assignedTo: [],
    todoCheckList: [],
    attachments: [],
  });

  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [loading, setLoading] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const handleValueChange = (key, value) => {
    setTaskData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const clearData = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "Low",
      dueDate: null,
      assignedTo: [],
      todoCheckList: [],
      attachments: [],
    });
  };

  const uploadAttachments = async (attachments = []) => {
    const uploadedAttachmentUrls = [];

    for (const file of attachments) {
      if (typeof file === "string") {
        uploadedAttachmentUrls.push(file);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("image", file);

        const uploadResponse = await axiosInstance.post(
          API_PATHS.IMAGE.UPLOAD_IMAGE,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        uploadedAttachmentUrls.push(uploadResponse.data.imageUrl);
      } catch (err) {
        console.error("Failed to upload file:", err);
        toast.error("Failed to upload: " + file.name);
        throw err;
      }
    }

    return uploadedAttachmentUrls;
  };

  const buildTodoChecklistPayload = (todoItems = [], previousTodoItems = []) =>
    todoItems.map((item) => {
      if (typeof item === "string") {
        const matchedTask = previousTodoItems.find((task) => task.text === item);
        return {
          text: item.trim(),
          completed: matchedTask ? matchedTask.completed : false,
        };
      }

      const normalizedText = item?.text?.trim() || "";
      const matchedTask = previousTodoItems.find((task) => task.text === normalizedText);

      return {
        text: normalizedText,
        completed:
          typeof item?.completed === "boolean"
            ? item.completed
            : matchedTask
              ? matchedTask.completed
              : false,
      };
    }).filter((item) => item.text);

  const createTask = async () => {
    setLoading(true);
    try {
      const todolist = buildTodoChecklistPayload(taskData.todoCheckList);
      const uploadedAttachmentUrls = await uploadAttachments(taskData.attachments || []);

      await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, {
        ...taskData,
        attachments: uploadedAttachmentUrls,
        dueDate: new Date(taskData.dueDate).toISOString(),
        todoCheckList: todolist,
      });

      toast.success("Task Created Successfully.");

      clearData();

    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.message || "Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async () => {
    setLoading(true);
    try {
      const prevTodoChecklist = currentTask?.todoChecklist || currentTask?.todoCheckList || [];
      const todoList = buildTodoChecklistPayload(taskData.todoCheckList, prevTodoChecklist);
      const uploadedAttachmentUrls = await uploadAttachments(taskData.attachments || []);

      await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId), {
        ...taskData,
        attachments: uploadedAttachmentUrls,
        dueDate: new Date(taskData.dueDate).toISOString(),
        todoCheckList: todoList,
      });

      toast.success("Task Updated Successfully.");
      navigate("/admin/tasks");
    }catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.message || "Failed to update task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!taskData.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!taskData.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!taskData.dueDate) {
      setError("DueDate is required.");
      return;
    }

    if (taskData.todoCheckList?.length === 0) {
      setError("Add at least one todo task.");
      return;
    }

    if (taskData.assignedTo?.length === 0) {
      setError("Task not assigned to any member.");
      return;
    }

    if (taskId) {
      updateTask();
      return;
    }

    createTask();
  };

  const getTaskDetailsByID = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(taskId));

      if (response.data) {
        const taskInfo = response.data;
        setCurrentTask(taskInfo);

        setTaskData({
          title: taskInfo.title || "",
          description: taskInfo.description || "",
          priority: taskInfo.priority || "Low",
          dueDate: taskInfo.dueDate
            ? moment(taskInfo.dueDate).format("YYYY-MM-DD")
            : null,
          assignedTo: taskInfo?.assignedTo?.map((item) => item?._id) || [],
          todoCheckList: taskInfo?.todoChecklist || taskInfo?.todoCheckList || [],
          attachments: taskInfo?.attachments || [],
        });
      }
    } catch(error) {
      console.error("Error fetching users:", error);
    }
  };

  const deleteTask = async () => { };

  useEffect(() => {
    if (taskId) {
      getTaskDetailsByID();
    }

    return () => {};
  }, [taskId]);

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="max-w-3xl mx-auto my-6 px-1 md:my-10">
        <div
          className="
          bg-[var(--surface)]
          border border-[var(--border)]
          rounded-2xl p-4 md:p-6
          shadow-sm
          hover:shadow-md
          transition-all duration-300
        "
        >
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)] tracking-tight">
                {taskId ? "Update Task" : "Create Task"}
              </h2>
              <p className="text-xs text-[var(--accent-hover)] mt-1">
                Manage your tasks efficiently
              </p>
            </div>

            {taskId && (
              <button
                onClick={() => setOpenDeleteAlert(true)}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition"
              >
                <LuTrash2 className="text-lg" />
                Delete
              </button>
            )}
          </div>

          <div className="space-y-8">
            {/* BASIC */}
            <div className="space-y-5">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Basic Information
              </h3>

              <div className="group">
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Task Title
                </label>

                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => handleValueChange("title", e.target.value)}
                  placeholder="Create app UI"
                  className="
                  w-full
                  bg-[var(--bg-soft)]
                  border border-[var(--border)]
                  rounded-lg
                  px-3 py-2
                  text-sm text-[var(--text)]
                  placeholder:text-[var(--text-muted)]
                  outline-none
                  transition-all duration-200 ease-in-out
                  focus:border-[var(--accent)]
                  focus:shadow-[0_0_0_1px_var(--accent)]
                  focus:bg-transparent
                  group-hover:border-[var(--text-muted)]
                "
                />
              </div>

              <div className="group">
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={taskData.description}
                  onChange={(e) => handleValueChange("description", e.target.value)}
                  placeholder="Write task details..."
                  className="
                  w-full
                  bg-[var(--bg-soft)]
                  border border-[var(--border)]
                  rounded-lg
                  px-3 py-2
                  text-sm text-[var(--text)]
                  placeholder:text-[var(--text-muted)]
                  outline-none resize-none
                  transition-all duration-200 ease-in-out
                  focus:border-[var(--accent)]
                  focus:shadow-[0_0_0_1px_var(--accent)]
                  focus:bg-transparent
                  group-hover:border-[var(--text-muted)]
                "
                />
              </div>
            </div>

            {/* SETTINGS */}
            <div className="space-y-5 pt-5 border-t border-[var(--border)]">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Task Settings
              </h3>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* PRIORITY */}
                <SelectDropdown
                  label="Priority"
                  options={PRIORITY_DATA}
                  value={taskData.priority}
                  onChange={(val) => handleValueChange("priority", val)}
                />

                {/* DATE */}
                <SelectDropdown
                  type="date"
                  label="Due Date"
                  value={taskData.dueDate}
                  onChange={(val) => handleValueChange("dueDate", val)}
                />

                <div className="space-y-1">
                  <label className="block text-xs text-[var(--text-muted)]">
                    Assign To
                  </label>

                  <SelectUsers
                    selectedUsers={taskData.assignedTo}
                    setSelectedUsers={(users) =>
                      handleValueChange("assignedTo", users)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-[var(--text-muted)] tracking-wide">
                TODO Checklist
              </label>

              <div
                className="
      
    "
              >
                <TodoListInput
                  todoList={taskData.todoCheckList}
                  setTodoList={(value) =>
                    handleValueChange("todoCheckList", value)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-[var(--text-muted)] tracking-wide">
                  Attachments
                </label>

                <div
                  className="
                    bg-[var(--bg-soft)]
                    border border-[var(--border)]
                    rounded-xl
                    px-3 py-3

                    transition-all duration-200
                    hover:border-[var(--text-muted)]
                  "
                >
                  <AddAttachmentsInput
                    attachments={taskData.attachments}
                    setAttachments={(valueOrUpdater) =>
                      handleValueChange(
                        "attachments",
                        typeof valueOrUpdater === "function"
                          ? valueOrUpdater(taskData.attachments || [])
                          : valueOrUpdater
                      )
                    }
                  />
                </div>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500 mt-4">{error}</p>
            )}

            {/* ACTIONS */}
            <div className="flex flex-col-reverse gap-3 pt-5 border-t border-[var(--border)] md:flex-row md:justify-end">
              <button
                onClick={clearData}
                className="
                w-full px-4 py-2 text-sm cursor-pointer
                rounded-lg border border-[var(--border)]
                text-[var(--text-muted)]
                hover:bg-[var(--bg-soft)]
                hover:text-[var(--text)]
                transition-all duration-200
                md:w-auto
              "
              >
                Clear
              </button>

              <button
                onClick={handleSubmit}
                className="
                w-full px-5 py-2 text-sm font-medium cursor-pointer
                rounded-lg
                bg-[var(--accent)]
                text-white
                shadow-sm
                hover:bg-[var(--accent-hover)]
                hover:shadow-md
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-200
                md:w-auto
              "
              >
                {taskId ? "Update Task" : "Create Task"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateTask;
