import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminPage from "@/features/admin/pages/AdminPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import { WorkspacePage } from "@/features/workspace";

import { canAccessAdmin, canViewReports } from "@/features/auth/utils/permissions";

import AppLayout from "@/layouts/AppLayout";

import { AttendanceProvider } from "@/providers/AttendanceProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";

import ProtectedRoute from "./ProtectedRoute";
import PlatformOwnerOnlyRoute from "./PlatformOwnerOnlyRoute";
import PermissionRoute from "./PermissionRoute";

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
        {/* ------------------------------------------------------------------ */}
        {/* Public                                                              */}
        {/* ------------------------------------------------------------------ */}

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        {/* ------------------------------------------------------------------ */}
        {/* Dashboard                                                           */}
        {/* ------------------------------------------------------------------ */}

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Workspace Management                                                */}
        {/* ------------------------------------------------------------------ */}

        <Route
          path="/admin"
          element={
            <ProtectedLayout>
              <PermissionRoute permission={canAccessAdmin}>
                <AdminPage />
              </PermissionRoute>
            </ProtectedLayout>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Platform Owner Only                                                 */}
        {/* ------------------------------------------------------------------ */}

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

        {/* ------------------------------------------------------------------ */}
        {/* Reports                                                             */}
        {/* ------------------------------------------------------------------ */}

        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <PermissionRoute permission={canViewReports}>
                <ReportsPage />
              </PermissionRoute>
            </ProtectedLayout>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Settings                                                            */}
        {/* ------------------------------------------------------------------ */}

        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <SettingsPage />
            </ProtectedLayout>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Unknown route                                                       */}
        {/* ------------------------------------------------------------------ */}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
