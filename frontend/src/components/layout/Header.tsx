import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

export default function Header({ title, showClock = false }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { signOut, user } = useAuth();
  const { workspace, workspaces, setWorkspace } = useWorkspace();
  const { settings, loading } = useSettingsContext();

  const open = Boolean(anchorEl);

  const platformOwner = isPlatformOwner(user);
  const workspaceManager = canManageWorkspace(user, workspace);

  const activeWorkspaces = workspaces.filter((item) => item.status === "ACTIVE");

  const pageTitle = useMemo(() => {
    if (title) {
      return title;
    }

    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard";

      case "/admin":
        return "Management";

      case "/workspace":
        return "Workspaces";

      case "/reports":
        return "Reports";

      case "/settings":
        return "Settings";

      case "/payroll":
        return "Payroll";

      case "/users":
        return "Users";

      default:
        return "WorkPulse";
    }
  }, [location.pathname, title]);

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
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {/* Left */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          minWidth: 0,
        }}
      >
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: 700,
          }}
        >
          {pageTitle}
        </Typography>
      </Box>

      {/* Center */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {showClock && !loading && settings && (
          <Clock variant="header" timezone={settings.timezone} locale={settings.locale} />
        )}
      </Box>

      {/* Right */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1,
          minWidth: 0,
        }}
      >
        <BusinessIcon fontSize="small" />

        <Typography
          variant="body2"
          noWrap
          sx={{
            maxWidth: 180,
          }}
        >
          {workspace?.name ?? "No Workspace"}
        </Typography>

        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: "success.main",
            ml: 1,
            flexShrink: 0,
          }}
        />

        <Typography
          variant="body2"
          sx={{
            whiteSpace: "nowrap",
          }}
        >
          Online
        </Typography>

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

          <MenuItem
            selected={location.pathname === "/dashboard"}
            onClick={() => handleNavigate("/dashboard")}
          >
            <DashboardIcon sx={{ mr: 1 }} />
            Dashboard
          </MenuItem>

          {workspaceManager && (
            <MenuItem
              selected={location.pathname === "/admin"}
              onClick={() => handleNavigate("/admin")}
            >
              <AdminPanelSettingsIcon sx={{ mr: 1 }} />
              Management
            </MenuItem>
          )}

          {platformOwner && (
            <MenuItem
              selected={location.pathname === "/workspace"}
              onClick={() => handleNavigate("/workspace")}
            >
              <BusinessIcon sx={{ mr: 1 }} />
              Workspaces
            </MenuItem>
          )}

          <MenuItem
            selected={location.pathname === "/reports"}
            onClick={() => handleNavigate("/reports")}
          >
            <AssessmentIcon sx={{ mr: 1 }} />
            Reports
          </MenuItem>

          <MenuItem
            selected={location.pathname === "/settings"}
            onClick={() => handleNavigate("/settings")}
          >
            <SettingsIcon sx={{ mr: 1 }} />
            Settings
          </MenuItem>

          <Divider />

          <MenuItem sx={{ color: "error.main" }} onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1, color: "error.main" }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
