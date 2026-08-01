import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Box, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BusinessIcon from "@mui/icons-material/Business";
import LogoutIcon from "@mui/icons-material/Logout";

import { Clock } from "@/components/ui";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { isPlatformOwner, canManageWorkspace } from "@/features/auth/utils/permissions";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";
import { useSettingsContext } from "@/features/settings/context/SettingsContext";

type HeaderProps = {
  title?: string;
  showClock?: boolean;
};

export default function Header({ title = "Dashboard", showClock = false }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { signOut, user } = useAuth();

  const { workspace, workspaces, setWorkspace } = useWorkspace();

  const { settings, loading } = useSettingsContext();

  const navigate = useNavigate();

  const open = Boolean(anchorEl);

  /**
   * Permission resolution
   *
   * Platform Owner:
   * - highest authority
   * - controlled by VITE_PLATFORM_OWNER_EMAIL
   * - ignores database role
   * - manages all workspaces
   *
   * Workspace Owner:
   * - manages owned workspace
   *
   * Admin:
   * - workspace administration
   */
  const platformOwner = isPlatformOwner(user);

  const workspaceManager = canManageWorkspace(user, workspace);

  const activeWorkspaces = workspaces.filter((item) => item.status === "ACTIVE");

  function closeMenu() {
    setAnchorEl(null);
  }

  async function handleLogout() {
    closeMenu();
    await signOut();
  }

  function handleNavigate(path: string) {
    closeMenu();
    navigate(path);
  }

  /**
   * Only Platform Owner can switch workspaces.
   */
  function handleWorkspaceChange(id: string) {
    if (!platformOwner) {
      return;
    }

    const selected = activeWorkspaces.find((item) => item.id === id);

    if (selected) {
      setWorkspace(selected);
      closeMenu();
    }
  }

  return (
    <Box
      sx={{
        height: 72,
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <Typography variant="h6">{title}</Typography>

      {showClock && !loading && settings && (
        <Clock variant="inline" timezone={settings.timezone} locale={settings.locale} />
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <BusinessIcon fontSize="small" />

        <Typography variant="body2">{workspace?.name ?? "No Workspace"}</Typography>

        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: "success.main",
            ml: 1,
          }}
        />

        <Typography>Online</Typography>

        <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
          <SettingsIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={closeMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          {platformOwner && (
            <>
              <Typography
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                Switch Workspace
              </Typography>

              {activeWorkspaces.map((item) => (
                <MenuItem
                  key={item.id}
                  selected={item.id === workspace?.id}
                  onClick={() => handleWorkspaceChange(item.id)}
                >
                  <BusinessIcon sx={{ mr: 1 }} />

                  {item.name}
                </MenuItem>
              ))}

              <Divider />
            </>
          )}

          <MenuItem onClick={() => handleNavigate("/dashboard")}>
            <DashboardIcon sx={{ mr: 1 }} />
            Dashboard
          </MenuItem>

          {workspaceManager && (
            <MenuItem onClick={() => handleNavigate("/admin")}>
              <AdminPanelSettingsIcon sx={{ mr: 1 }} />
              Admin Dashboard
            </MenuItem>
          )}

          {platformOwner && (
            <MenuItem onClick={() => handleNavigate("/workspace")}>
              <BusinessIcon sx={{ mr: 1 }} />
              Workspace
            </MenuItem>
          )}

          <MenuItem onClick={() => handleNavigate("/reports")}>
            <AssessmentIcon sx={{ mr: 1 }} />
            Reports
          </MenuItem>

          <MenuItem onClick={() => handleNavigate("/settings")}>
            <SettingsIcon sx={{ mr: 1 }} />
            Settings
          </MenuItem>

          <Divider />

          <MenuItem
            sx={{
              color: "error.main",
            }}
            onClick={handleLogout}
          >
            <LogoutIcon
              sx={{
                mr: 1,
                color: "error.main",
              }}
            />
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
