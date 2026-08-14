import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BusinessIcon from "@mui/icons-material/Business";
import LogoutIcon from "@mui/icons-material/Logout";
import MoreVertIcon from "@mui/icons-material/MoreVert";

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

  const theme = useTheme();

  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

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

  const showDesktopControls = isDesktop;
  const showMenuButton = !isDesktop;

  /*
   * Clock:
   *
   * Desktop:
   *   Visible in the center of the header.
   *
   * Tablet:
   *   Visible in the center of the header.
   *
   * Phone:
   *   Hidden from the header and shown inside the menu.
   */
  const showHeaderClock = !isPhone && showClock && !loading && settings;
  const showMenuClock = isPhone && showClock && !loading && settings;

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,

        height: 72,

        px: {
          xs: 1.5,
          sm: 3,
        },

        display: "flex",
        alignItems: "center",

        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",

        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {/* =========================================================
          TITLE — LEFT
          ========================================================= */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",

          minWidth: 0,

          mr: "auto",
        }}
      >
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: 700,

            fontSize: {
              xs: "1rem",
              sm: "1.25rem",
            },
          }}
        >
          {pageTitle}
        </Typography>
      </Box>

      {/* =========================================================
          CLOCK — EXACT CENTER
          
          Absolutely positioned so its position is independent
          of title/workspace/menu widths.
          ========================================================= */}

      <Box
        sx={{
          position: "absolute",

          left: "50%",
          top: "50%",

          transform: "translate(-50%, -50%)",

          display: {
            xs: "none",
            sm: "flex",
          },

          alignItems: "center",
          justifyContent: "center",

          /*
           * Prevent the clock from intercepting clicks.
           */
          pointerEvents: "none",

          /*
           * Protect the clock from becoming wider than the
           * available header area on smaller tablets.
           */
          maxWidth: {
            sm: "40%",
            md: "45%",
            lg: "50%",
          },

          minWidth: 0,
        }}
      >
        {showHeaderClock && (
          <Clock variant="header" timezone={settings.timezone} locale={settings.locale} />
        )}
      </Box>

      {/* =========================================================
          RIGHT SIDE
          ========================================================= */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",

          minWidth: 0,
          flexShrink: 0,

          ml: "auto",
        }}
      >
        {/* =======================================================
            DESKTOP
            Workspace + Online + Settings
            ======================================================= */}

        {showDesktopControls && (
          <>
            <BusinessIcon fontSize="small" />

            <Typography
              variant="body2"
              noWrap
              sx={{
                maxWidth: 180,
                ml: 0.5,
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
                ml: 0.5,
              }}
            >
              Online
            </Typography>

            <IconButton
              onClick={(event) => setAnchorEl(event.currentTarget)}
              aria-label="Settings"
              sx={{
                ml: 0.5,
              }}
            >
              <SettingsIcon />
            </IconButton>
          </>
        )}

        {/* =======================================================
            TABLET / PHONE
            Three-dot menu
            ======================================================= */}

        {showMenuButton && (
          <IconButton
            onClick={(event) => setAnchorEl(event.currentTarget)}
            aria-label="More options"
            sx={{
              mr: {
                xs: -0.5,
                sm: -0.5,
              },
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )}

        {/* =======================================================
            MENU
            ======================================================= */}

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
          slotProps={{
            paper: {
              sx: {
                mt: 1,

                /*
                 * Paper provides the rounded outer boundary.
                 */
                borderRadius: 2,

                /*
                 * Keep content clipped inside rounded corners.
                 */
                overflow: "hidden",
              },
            },

            list: {
              sx: {
                /*
                 * MenuList is the scrolling container.
                 * This keeps the scrollbar inside the rounded
                 * Paper rather than crossing its edges.
                 */
                maxHeight: "calc(100vh - 88px)",

                overflowY: "auto",
                overflowX: "hidden",

                scrollbarGutter: "stable",

                WebkitOverflowScrolling: "touch",

                p: 0,
              },
            },
          }}
        >
          {/* =====================================================
              PHONE — CLOCK
              ===================================================== */}

          {showMenuClock && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock variant="header" timezone={settings.timezone} locale={settings.locale} />
              </Box>

              <Divider />
            </>
          )}

          {/* =====================================================
              TABLET / PHONE — CURRENT WORKSPACE + STATUS
              ===================================================== */}

          {!isDesktop && (
            <>
              <Typography
                sx={{
                  px: 2,
                  pt: 1,
                  pb: 0.5,

                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                Workspace
              </Typography>

              <MenuItem disabled>
                <BusinessIcon
                  sx={{
                    mr: 1,
                  }}
                />

                {workspace?.name ?? "No Workspace"}
              </MenuItem>

              <MenuItem disabled>
                <Box
                  sx={{
                    width: 10,
                    height: 10,

                    borderRadius: "50%",

                    bgcolor: "success.main",

                    mr: 1,

                    flexShrink: 0,
                  }}
                />
                Online
              </MenuItem>

              <Divider />
            </>
          )}

          {/* =====================================================
              PLATFORM OWNER — SWITCH WORKSPACE
              ===================================================== */}

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
                  <BusinessIcon
                    sx={{
                      mr: 1,
                    }}
                  />

                  {item.name}
                </MenuItem>
              ))}

              <Divider />
            </>
          )}

          {/* =====================================================
              NAVIGATION
              ===================================================== */}

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

          {/* =====================================================
              LOGOUT
              ===================================================== */}

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
