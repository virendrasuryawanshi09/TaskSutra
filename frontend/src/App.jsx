import React from 'react'
import {
  BrowserROuter as Router,
  Routes,
  Route,
}from "react-router-dom"

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<PrivateRoute allowedRoles={["asmin"]}/>}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/tasks" element={<ManageTasks/>} />
            <Route path="/admin/create-task" element={<CreateTask/>} />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App