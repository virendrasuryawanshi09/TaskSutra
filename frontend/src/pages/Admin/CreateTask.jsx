import React, { useState } from "react";
import DashboardLayout from "../../components/Layouts/DashboardLayout";
import SelectDropdown from "../../components/input/SelectDropdown"
import { PRIORITY_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { LuTrash2 } from "react-icons/lu";
import "react-datepicker/dist/react-datepicker.css";
import "./CreateTask.css";
import SelectUsers from "../../components/input/SelectUsers";
import TodoListInput from "../../components/input/TodoListInput";

const CreateTask = () => {
  const location = useLocation();
  const { taskId } = location.state || {};
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

  const createTask = async () => { };

  const updateTask = async () => { };

  const handleSubmit = async () => { };

  const getTaskDetailsByID = async () => { };

  const deleteTask = async () => { };

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
            </div>
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
