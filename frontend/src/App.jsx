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
<<<<<<< HEAD
import SharedRideSearch from './pages/Passanger/SharedRideSearch'
import SharedRidesDashboard from './pages/Rider/SharedRidesDashboard'
import CreateSharedRide from './pages/Rider/CreateSharedRide'
=======
import PaymentTab from './pages/Passanger/PaymentTab'
import PaymentSuccess from './pages/Passanger/PaymentSuccess'
import PaymentCancel from './pages/Passanger/PaymentCancel'
>>>>>>> c3266098c53d87f030e42f01565ece40bef8b30b

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
        <Route path="/rider-dashboard" element={
          <ProtectedRoute>
            <RiderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/rider-dashboard/ride/:rideId" element={
          <ProtectedRoute>
            <SharedRidesDashboard />
          </ProtectedRoute>
        } />
        <Route path="/rider/create-shared-ride" element={
          <ProtectedRoute>
            <CreateSharedRide />
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
        <Route path="/shared-ride-search" element={
          <ProtectedRoute>
            <SharedRideSearch />
          </ProtectedRoute>
        } />
        <Route path="/payment/success" element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        } />
        <Route path="/payment/cancel" element={
          <ProtectedRoute>
            <PaymentCancel />
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
        <Route path="/payment" element={
          <ProtectedRoute>
            <PaymentTab />
          </ProtectedRoute>
        } />
        <Route path="/payment/success" element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        } />
        <Route path="/payment/cancel" element={
          <ProtectedRoute>
            <PaymentCancel />
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}
