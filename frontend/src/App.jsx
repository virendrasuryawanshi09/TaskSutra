import React, { useEffect, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import SignUp from "./pages/Auth/SignUp";
import Login from "./pages/Auth/Login";
import PrivateRoute from "./routes/PrivateRoute";
import MyTasks from "./pages/User/MyTasks";
import UserDashboard from "./pages/User/Dashboard/UserDashboard";
import ViewTaskDetails from "./pages/User/Tasks/ViewTaskDetails";
import UserTeamMembers from "./pages/User/TeamMembers/UserTeamMembers";
import DirectChat from "./pages/Chat/DirectChat";
import useUserAuth from "./hooks/useUserAuth";
import EditProfile from "./pages/User/Profile/EditProfile";

// Lazy-loaded Admin pages
const Dashboard = React.lazy(() => import("./pages/Admin/Dashboard"));
const ManageTasks = React.lazy(() => import("./pages/Admin/ManageTasks"));
const CreateTask = React.lazy(() => import("./pages/Admin/CreateTask"));
const ManageUsers = React.lazy(() => import("./pages/Admin/ManageUsers"));
const QueryEngine = React.lazy(() => import("./pages/Admin/QueryEngine"));

const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg)] text-[var(--text-muted)] text-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      <span>Loading dashboard...</span>
    </div>
  </div>
);

const RootRedirect = () => {
  const { isAuthenticated, role, user } = useUserAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === "member" && !user?.companyId) {
    return <Navigate to="/user/dashboard" replace />;
  }

  return (
    <Navigate to={(role === "admin" || role === "ceo") ? "/admin/dashboard" : "/user/dashboard"} replace />
  );
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, role } = useUserAuth();
  if (isAuthenticated) {
    return <Navigate to={(role === "admin" || role === "ceo") ? "/admin/dashboard" : "/user/dashboard"} replace />;
  }
  return children;
};

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
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

          {/* Admin */}
          <Route element={<PrivateRoute allowedRoles={["admin", "ceo"]} />}>
            <Route path="/admin/dashboard" element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
            <Route path="/admin/tasks" element={<Suspense fallback={<LoadingScreen />}><ManageTasks /></Suspense>} />
            <Route path="/admin/create-task" element={<Suspense fallback={<LoadingScreen />}><CreateTask /></Suspense>} />
            <Route path="/admin/tasks/:id" element={<Suspense fallback={<LoadingScreen />}><CreateTask /></Suspense>} />
            <Route path="/admin/users" element={<Suspense fallback={<LoadingScreen />}><ManageUsers /></Suspense>} />
            <Route path="/admin/chat" element={<DirectChat defaultCommunity={true} />} />
            <Route path="/admin/direct-chat" element={<DirectChat />} />
          </Route>

          {/* CEO Only */}
          <Route element={<PrivateRoute allowedRoles={["ceo"]} />}>
            <Route path="/ceo/query-engine" element={<Suspense fallback={<LoadingScreen />}><QueryEngine /></Suspense>} />
          </Route>

          {/* User */}
          <Route element={<PrivateRoute allowedRoles={["member"]} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/my-tasks" element={<MyTasks />} />
            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
            <Route path="/user/team-members" element={<UserTeamMembers />} />
            <Route path="/user/profile" element={<EditProfile />} />
            <Route path="/user/chat" element={<DirectChat defaultCommunity={true} />} />
            <Route path="/user/direct-chat" element={<DirectChat />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
};

export default App;
