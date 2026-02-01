import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Check if user is logged in (stored in localStorage)
  const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";

  if (!isAuthenticated) {
    // Redirect to rider login if not authenticated
    return <Navigate to="/rider-login" replace />;
  }

  return children;
}
