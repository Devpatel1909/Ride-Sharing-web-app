import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import Landing from './pages/Landing'
// eslint-disable-next-line no-unused-vars
import Rider_login from './pages/Rider/Signup'
import RideSearch from './pages/Rider/RideSearch'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/rider-login" element={<Rider_login />} />
        <Route path="/ride-search" element={
          <ProtectedRoute>
            <RideSearch />
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}
