import React, { Fragment, forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../../components/Layouts/DashboardLayout";
import { PRIORITY_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import { LuTrash2 } from "react-icons/lu";
import { HiCalendarDays, HiCheck, HiChevronUpDown } from "react-icons/hi2";
import { Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./CreateTask.css";

const PriorityButton = ({ value }) => {
  const priorityColor =
    value === "Low" ? "text-green-500" : value === "Medium" ? "text-blue-500" : "text-orange-500";

  return (
    <span className={`font-medium ${priorityColor}`}>
      {value}
    </span>
  );
};

const DateInputButton = forwardRef(
  ({ value, onChange, onBlur, onIconClick, placeholder = "dd-mm-yyyy" }, ref) => (
    <div className="relative w-full">
      <input
        ref={ref}
        type="text"
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className="
          w-full
          min-h-[42px]
          bg-[var(--bg-soft)]
          border border-[var(--border)]
          rounded-lg
          px-3 py-2 pr-10
          text-sm text-[var(--text)]
          placeholder:text-[var(--text-muted)]
          outline-none
          transition-all duration-200
          focus:border-[var(--accent)]
          focus:bg-transparent
          focus:shadow-[0_0_0_1px_var(--accent)]
        "
      />

      <button
        type="button"
        onClick={onIconClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
        tabIndex={-1}
        aria-label="Open calendar"
      >
        <HiCalendarDays className="h-4 w-4" />
      </button>
    </div>
  )
);

DateInputButton.displayName = "DateInputButton";

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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [priorityMenuStyle, setPriorityMenuStyle] = useState({});
  const priorityButtonRef = useRef(null);
  const priorityMenuRef = useRef(null);

  const selectedDate = useMemo(() => {
    if (!taskData.dueDate) return null;

    const parsedDate = moment(taskData.dueDate, ["YYYY-MM-DD", "DD-MM-YYYY"], true);
    return parsedDate.isValid() ? parsedDate.toDate() : null;
  }, [taskData.dueDate]);

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

  const createTask = async () => {};

  const updateTask = async () => {};

  const handleSubmit = async () => {};

  const getTaskDetailsByID = async () => {};

  const deleteTask = async () => {};

  useEffect(() => {
    if (!isPriorityOpen) return;

    const updatePriorityMenuPosition = () => {
      if (!priorityButtonRef.current) return;
      const rect = priorityButtonRef.current.getBoundingClientRect();

      setPriorityMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 90,
      });
    };

    const handlePointerDown = (event) => {
      if (
        priorityButtonRef.current?.contains(event.target) ||
        priorityMenuRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsPriorityOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsPriorityOpen(false);
      }
    };

    updatePriorityMenuPosition();
    window.addEventListener("resize", updatePriorityMenuPosition);
    window.addEventListener("scroll", updatePriorityMenuPosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePriorityMenuPosition);
      window.removeEventListener("scroll", updatePriorityMenuPosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPriorityOpen]);

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

            <div className="space-y-5 pt-5 border-t border-[var(--border)]">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                Task Settings
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Priority
                  </label>

                  <div className="relative">
                    <button
                      ref={priorityButtonRef}
                      type="button"
                      onClick={() => setIsPriorityOpen((prev) => !prev)}
                      className="
                        w-full
                        bg-[var(--bg-soft)]
                        border border-[var(--border)]
                        rounded-lg
                        px-3 py-2
                        text-sm text-left
                        outline-none

                        transition-all duration-200
                        focus:border-[var(--accent)]
                        focus:shadow-[0_0_0_1px_var(--accent)]
                      "
                    >
                      <PriorityButton value={taskData.priority} />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        <HiChevronUpDown className="w-4 h-4" />
                      </span>
                    </button>

                    {typeof document !== "undefined" &&
                      createPortal(
                        <Transition
                          as={Fragment}
                          show={isPriorityOpen}
                          enter="transition duration-200 ease-out"
                          enterFrom="opacity-0 scale-95"
                          enterTo="opacity-100 scale-100"
                          leave="transition duration-200 ease-out"
                          leaveFrom="opacity-100 scale-100"
                          leaveTo="opacity-0 scale-95"
                        >
                          <div
                            ref={priorityMenuRef}
                            style={priorityMenuStyle}
                            className="
                              overflow-hidden rounded-lg border border-[var(--border)]
                              bg-[var(--surface)] p-1 shadow-[0_10px_30px_rgba(15,23,42,0.10)]
                              outline-none
                            "
                          >
                            {PRIORITY_DATA.map((item) => {
                              const selected = taskData.priority === item.label;

                              return (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={() => {
                                    handleValueChange("priority", item.label);
                                    setIsPriorityOpen(false);
                                  }}
                                  className={`
                                    flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm
                                    transition-colors duration-200 hover:bg-[var(--bg-soft)]
                                    ${selected ? "bg-[var(--bg-soft)] text-[var(--text)]" : "text-[var(--text)]"}
                                  `}
                                >
                                  <span>{item.label}</span>
                                  {selected && <HiCheck className="h-4 w-4 text-[var(--accent)]" />}
                                </button>
                              );
                            })}
                          </div>
                        </Transition>,
                        document.body
                      )}
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Due Date
                  </label>

                  <DatePicker
                    open={isDatePickerOpen}
                    selected={selectedDate}
                    onChange={(date) =>
                      {
                        handleValueChange("dueDate", date ? moment(date).format("YYYY-MM-DD") : null);
                        setIsDatePickerOpen(false);
                      }
                    }
                    onClickOutside={() => setIsDatePickerOpen(false)}
                    onSelect={() => setIsDatePickerOpen(false)}
                    onChangeRaw={(event) => {
                      handleValueChange("dueDate", event.target.value);
                    }}
                    onInputClick={(event) => {
                      event.preventDefault();
                    }}
                    preventOpenOnFocus
                    dateFormat="dd-MM-yyyy"
                    customInput={
                      <DateInputButton onIconClick={() => setIsDatePickerOpen((prev) => !prev)} />
                    }
                    onBlur={() => {
                      if (!taskData.dueDate) return;

                      const parsedDate = moment(taskData.dueDate, ["DD-MM-YYYY", "YYYY-MM-DD"], true);
                      if (parsedDate.isValid()) {
                        handleValueChange("dueDate", parsedDate.format("YYYY-MM-DD"));
                      }
                    }}
                    popperPlacement="bottom-end"
                    calendarClassName="tasksutra-datepicker"
                    popperClassName="tasksutra-datepicker-popper"
                    wrapperClassName="block w-full"
                    showPopperArrow={false}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-5 border-t border-[var(--border)] md:flex-row md:justify-end">
              <button
                onClick={clearData}
                className="
                  w-full px-4 py-2
                  text-sm
                  cursor-pointer
                  rounded-lg
                  border border-[var(--border)]
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
                  w-full px-5 py-2
                  text-sm font-medium
                  cursor-pointer
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
