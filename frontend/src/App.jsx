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
import PaymentSuccess from './pages/Passanger/PaymentSuccess'
import PaymentCancel from './pages/Passanger/PaymentCancel'
import RiderDashboard from './pages/Rider/RiderDashboard'
import RideRequests from './pages/Rider/RideRequests'
import ProtectedRoute from './components/ProtectedRoute'
import MapPage from './pages/Map/MapPage'
import Profile from './pages/Profile'
import TrackingMap from './pages/TrackingMap'
import SharedRideSearch from './pages/Passanger/SharedRideSearch'
import SharedRidesDashboard from './pages/Rider/SharedRidesDashboard'
import CreateSharedRide from './pages/Rider/CreateSharedRide'
import PaymentTab from './pages/Passanger/PaymentTab'

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
          <ProtectedRoute role="rider">
            <RiderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/rider-dashboard" element={
          <ProtectedRoute role="rider">
            <RiderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/rider-dashboard/ride/:rideId" element={
          <ProtectedRoute role="rider">
            <SharedRidesDashboard />
          </ProtectedRoute>
        } />
        <Route path="/rider/create-shared-ride" element={
          <ProtectedRoute role="rider">
            <CreateSharedRide />
          </ProtectedRoute>
        } />
        <Route path="/rider/ride-requests" element={
          <ProtectedRoute role="rider">
            <RideRequests />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute role="passenger">
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/ride-search" element={
          <ProtectedRoute role="passenger">
            <RideSearch />
          </ProtectedRoute>
        } />
        <Route path="/shared-ride-search" element={
          <ProtectedRoute role="passenger">
            <SharedRideSearch />
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute role="passenger">
            <MapPage />
           </ProtectedRoute>
        } />
        <Route path="/tracking" element={
          <ProtectedRoute>
            <TrackingMap />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute role="passenger">
            <PaymentTab />
          </ProtectedRoute>
        } />
        <Route path="/payment/success" element={
          <ProtectedRoute role="passenger">
            <PaymentSuccess />
          </ProtectedRoute>
        } />
        <Route path="/payment/cancel" element={
          <ProtectedRoute role="passenger">
            <PaymentCancel />
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}
