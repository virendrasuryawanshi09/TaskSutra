import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./pages/Admin/Dashboard";
import ManageTasks from "./pages/Admin/ManageTasks";
import CreateTask from "./pages/Admin/CreateTask";
import SignUp from "./pages/Auth/SignUp";
import Login from "./pages/Auth/Login";
import PrivateRoute from "./routes/PrivateRoute";
import ManageUsers from "./pages/Admin/ManageUsers";
import MyTasks from "./pages/User/MyTasks";
import UserDashboard from "./pages/User/UserDashboard";
import ViewTaskDetails from "./pages/User/ViewTaskDetails";

const App = () => {


  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (e) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };


    applyTheme(mediaQuery);

    mediaQuery.addEventListener("change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, []);

  return (
    <div>
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          duration: 3200,
          style: {
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: "12px",
            padding: "12px 14px",
            fontSize: "13.5px",
            border: "1px solid var(--border)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            lineHeight: "1.4",
            letterSpacing: "-0.1px",
          },
          success: {
            iconTheme: {
              primary: "#4C7F6A",
              secondary: "white",
            },
            style: {
              borderLeft: "3px solid #4C7F6A",
            },
          },
          error: {
            iconTheme: {
              primary: "#B2554A",
              secondary: "white",
            },
            style: {
              borderLeft: "3px solid #B2554A",
            },
          },
          loading: {
            style: {
              borderLeft: "3px solid var(--accent)",
            },
          },
        }}
      />

      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/tasks" element={<ManageTasks />} />
            <Route path="/admin/create-task" element={<CreateTask />} />
            <Route path="/admin/tasks/:id" element={<CreateTask />} />
            <Route path="/admin/users" element={<ManageUsers />} />
          </Route>

          {/* User */}
          <Route element={<PrivateRoute allowedRoles={["member"]} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/my-tasks" element={<MyTasks />} />
            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
};

export default App;
