import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import GoogleAuthCallback from './pages/Auth/GoogleAuthCallback'
import Landing from './pages/Landing'
// eslint-disable-next-line no-unused-vars
import Rider_login from './pages/Rider/Signup'
import RideSearch from './pages/Passanger/RideSearch'
import RiderDashboard from './pages/Rider/RiderDashboard'
import RideRequests from './pages/Rider/RideRequests'
import ProtectedRoute from './components/ProtectedRoute'
import MapPage from './pages/Map/MapPage'
import Profile from './pages/Profile'
import TrackingMap from './pages/TrackingMap'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/google/success" element={<GoogleAuthCallback />} />
        <Route path="/rider-login" element={<Rider_login />} />
        <Route path="/rider/dashboard" element={
          <ProtectedRoute>
            <RiderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/rider/ride-requests" element={
          <ProtectedRoute>
            <RideRequests />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/ride-search" element={
          <ProtectedRoute>
            <RideSearch />
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute>
            <MapPage />
           </ProtectedRoute>
        } />
        <Route path="/tracking" element={
          <ProtectedRoute>
            <TrackingMap />
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}
