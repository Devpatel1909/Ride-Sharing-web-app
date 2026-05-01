import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role = null }) {
  const userToken = sessionStorage.getItem("token");
  const riderToken = sessionStorage.getItem("riderToken");

  if (!userToken && !riderToken) {
    return <Navigate to="/login" replace />;
  }

  if (role === "rider" && !riderToken) {
    if (userToken) {
      return <Navigate to="/ride-search" replace />;
    }
    return <Navigate to="/rider-login" replace />;
  }

  if (role === "passenger" && !userToken) {
    if (riderToken) {
      return <Navigate to="/rider/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
