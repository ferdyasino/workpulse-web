import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminPage from "@/features/admin/pages/AdminPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import { WorkspacePage } from "@/features/workspace";

import AppLayout from "@/layouts/AppLayout";

import { AttendanceProvider } from "@/providers/AttendanceProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";

import ProtectedRoute from "./ProtectedRoute";
import PlatformOwnerOnlyRoute from "./PlatformOwnerOnlyRoute";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <AttendanceProvider>
          <AppLayout>{children}</AppLayout>
        </AttendanceProvider>
      </WorkspaceProvider>
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

        {/* Platform Owner only
            Global workspace administration:
            - create workspace
            - edit workspace
            - delete workspace
            - manage tenants
        */}
        <Route
          path="/workspace"
          element={
            <ProtectedLayout>
              <PlatformOwnerOnlyRoute>
                <WorkspacePage />
              </PlatformOwnerOnlyRoute>
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
