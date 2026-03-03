import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
}from "react-router-dom"
import Dashboard from "./pages/Admin/Dashboard"
import ManageTasks from "./pages/Admin/ManageTasks"
import CreateTask from "./pages/Admin/CreateTask"
import SignUp from "./pages/Auth/SignUp"
import Login from "./pages/Auth/Login"
import PrivateRoute from "./routes/PrivateRoute"
import ManageUsers from "./pages/Admin/ManageUsers"
import MyTasks from "./pages/User/MyTasks"
import UserDashboard from "./pages/User/UserDashboard"
import ViewTaskDetails from './pages/User/ViewTaskDetails'

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin */}
          <Route element={<PrivateRoute allowedRoles={["admin"]}/>}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/tasks" element={<ManageTasks/>} />
            <Route path="/admin/create-task" element={<CreateTask/>} />
            <Route path="/admin/users" element={<ManageUsers/>} />
          </Route>

           {/* User */}
          <Route element={<PrivateRoute allowedRoles={["asmin"]}/>}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/my-tasks" element={<MyTasks />} />
            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App