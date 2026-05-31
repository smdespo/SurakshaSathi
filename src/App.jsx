import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "./context/AuthContext.jsx";

// Pages
import Dashboard from "./pages/public/Dashboard.jsx";
import UploadEvidence from "./pages/public/UploadEvidence.jsx";
import Alerts         from "./pages/public/Alerts.jsx";
import Notifications  from "./pages/public/Notifications.jsx";
import AdminLogin     from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ReportDetail   from "./pages/admin/ReportDetail.jsx";

function AdminGuard({ children }) {
  const { admin } = useAuth(); // or isAdmin depending on your AuthContext keys
  return admin ? children : <Navigate to="/admin/login" replace />;
}

// 💡 Separated the route tree to ensure AuthProvider fully encapsulates context consumers
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"              element={<Dashboard />} />
      <Route path="/upload"       element={<UploadEvidence />} />
      <Route path="/alerts"       element={<Alerts />} />
      <Route path="/notifications" element={<Notifications />} />

      {/* Admin Auth */}
      <Route path="/admin/login"  element={<AdminLogin />} />

      {/* Admin Protected */}
      <Route path="/admin" element={
        <AdminGuard><AdminDashboard /></AdminGuard>
      } />
      <Route path="/admin/reports/:id" element={
        <AdminGuard><ReportDetail /></AdminGuard>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}