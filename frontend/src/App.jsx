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

          
        </Routes>
      </Router>
    </div>
  )
}

export default App