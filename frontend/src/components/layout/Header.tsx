import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Box, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";

import { Clock } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";

type HeaderProps = {
  title?: string;
  showClock?: boolean;
};

export default function Header({ title = "Dashboard", showClock = false }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const open = Boolean(anchorEl);

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
      {/* LEFT */}
      <Typography variant="h6">{title}</Typography>

      {/* CENTER ADMIN CLOCK */}
      {showClock && <Clock variant="inline" timezone="America/New_York" />}

      {/* RIGHT */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: "success.main",
          }}
        />

        <Typography>Online</Typography>

        <IconButton
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
          }}
        >
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
          <MenuItem onClick={() => handleNavigate("/dashboard")}>
            <DashboardIcon sx={{ mr: 1 }} />
            Dashboard
          </MenuItem>

          <MenuItem onClick={() => handleNavigate("/admin")}>
            <AdminPanelSettingsIcon sx={{ mr: 1 }} />
            Admin Dashboard
          </MenuItem>

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
