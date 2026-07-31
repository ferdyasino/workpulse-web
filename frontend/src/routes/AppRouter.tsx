import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminPage from "@/features/admin/pages/AdminPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import { WorkspacePage } from "@/features/workspace";

import AppLayout from "@/layouts/AppLayout";

import { AttendanceProvider } from "@/providers/AttendanceProvider";

import ProtectedRoute from "./ProtectedRoute";
import OwnerOnlyRoute from "./OwnerOnlyRoute";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AttendanceProvider>
        <AppLayout>{children}</AppLayout>
      </AttendanceProvider>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedLayout>
              <AdminPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/workspace"
          element={
            <ProtectedLayout>
              <OwnerOnlyRoute>
                <WorkspacePage />
              </OwnerOnlyRoute>
            </ProtectedLayout>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <ReportsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <SettingsPage />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
