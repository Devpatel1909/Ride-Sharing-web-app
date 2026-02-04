import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Check if user or rider is logged in
  const userToken = localStorage.getItem("token");
  const riderToken = localStorage.getItem("riderToken");

  if (!userToken && !riderToken) {
    // Redirect to rider login if not authenticated
    return <Navigate to="/rider-login" replace />;
  }

  return children;
}
