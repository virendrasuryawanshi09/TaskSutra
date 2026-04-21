import React, { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import { UserContext } from "../../../context/UserContextState";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import TodayTasks from "./Components/TodayTasks";
import TaskTable from "./Components/TaskTable";

const UserDashboard = () => {
  const { user } = useContext(UserContext);
  const [tasks, setTasks] = useState([]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
        ? "Good Afternoon"
        : "Good Evening";

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    const getUserTasks = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
        setTasks(response.data?.tasks || []);
      } catch (error) {
        console.error("Error fetching user tasks:", error);
      }
    };

    getUserTasks();
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">
            {greeting}, {user?.name || "User"}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{formattedDate}</p>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text)]">Stats</h2>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <TodayTasks tasks={tasks} />
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">Task Table</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Track assigned work and open task actions.
            </p>
          </div>
          <TaskTable tasks={tasks} />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
