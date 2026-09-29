import { useEffect, useRef, useState } from "react";

import {
  AccessTime,
  Assessment,
  CalendarMonth,
  Login,
  Logout,
  People,
  PlayArrow,
  Restaurant,
  WorkOutlined,
} from "@mui/icons-material";
import { Box, Button, Chip, Container, Divider, Paper, Typography } from "@mui/material";

import { Clock } from "@/components/ui";
import LoginForm from "@/features/auth/components/LoginForm";
import { getBrowserTimezone } from "@/utils/time";

const features = [
  {
    icon: <AccessTime />,
    title: "Attendance Tracking",
    description: "Record Time In, Time Out, Breaks, and Lunch throughout the workday.",
  },
  {
    icon: <CalendarMonth />,
    title: "Shift Management",
    description: "Assign employee schedules and manage regular and overnight shifts.",
  },
  {
    icon: <Assessment />,
    title: "Attendance Reports",
    description: "Review working hours, late time, undertime, overtime, and attendance history.",
  },
  {
    icon: <People />,
    title: "Employee Management",
    description: "Organize employees, departments, positions, and workspace access.",
  },
];

const workflowSteps = [
  {
    number: "01",
    icon: <Login />,
    title: "Sign In",
    description: "Access your WorkPulse account.",
  },
  {
    number: "02",
    icon: <AccessTime />,
    title: "Time In",
    description: "Start your scheduled workday.",
  },
  {
    number: "03",
    icon: <WorkOutlined />,
    title: "Track Your Day",
    description: "Record breaks and lunch when needed.",
  },
  {
    number: "04",
    icon: <Logout />,
    title: "Time Out",
    description: "Finish your workday and record your hours.",
  },
];

/* -------------------------------------------------------------------------- */
/* Attendance Preview                                                         */
/* -------------------------------------------------------------------------- */

function AttendancePreview() {
  return (
    <Box
      className="wp-preview-enter"
      sx={{
        width: "100%",
        maxWidth: 560,
        mx: "auto",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          overflow: "hidden",
          border: 1,
          borderColor: "rgba(255,255,255,0.09)",
          borderRadius: 4,
          p: {
            xs: 3,
            sm: 4,
          },
          backgroundColor: "background.paper",
          backgroundImage: "none",
          boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
          position: "relative",

          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.7), transparent)",
            opacity: 0.8,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                Today
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  letterSpacing: -0.4,
                }}
              >
                Employee Attendance
              </Typography>
            </Box>

            <Chip
              label="WORKING"
              color="success"
              size="small"
              sx={{
                fontWeight: 700,
                boxShadow: "0 0 0 1px rgba(34,197,94,0.12)",
              }}
            />
          </Box>

          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Current Work Session
            </Typography>

            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                letterSpacing: -1,
                fontSize: {
                  xs: "2.5rem",
                  sm: "3.5rem",
                },
                lineHeight: 1.1,
              }}
            >
              08:42
            </Typography>

            <Typography variant="body2" color="text.secondary">
              hours worked
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box
              className="wp-preview-row"
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <AccessTime fontSize="small" color="success" />

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Time In
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Started work
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                08:02 AM
              </Typography>
            </Box>

            <Box
              className="wp-preview-row"
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Restaurant fontSize="small" color="action" />

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Lunch
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Recorded break
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                12:00 PM
              </Typography>
            </Box>

            <Box
              className="wp-preview-row"
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <WorkOutlined fontSize="small" color="primary" />

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Working
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Current session
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="success.main">
                Active
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              pt: 1,
            }}
          >
            <PlayArrow fontSize="small" color="action" />

            <Typography variant="caption" color="text.secondary">
              Attendance updates as you work
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* Login Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function LoginPage() {
  const loginSectionRef = useRef<HTMLDivElement | null>(null);
  const [showHeaderLogin, setShowHeaderLogin] = useState(false);

  /* Header Login Visibility */
  useEffect(() => {
    const loginSection = loginSectionRef.current;

    if (!loginSection) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowHeaderLogin(!entry.isIntersecting);
      },
      {
        threshold: 0.15,
        rootMargin: "-96px 0px 0px 0px",
      },
    );

    observer.observe(loginSection);

    return () => observer.disconnect();
  }, []);

  /* Section entrance animation */
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-wp-section]");

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("wp-section-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px",
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleHeaderLogin = () => {
    loginSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Sticky Header                                                      */}
      {/* ------------------------------------------------------------------ */}

      <Box
        component="header"
        sx={(theme) => ({
          position: "sticky",
          top: 0,
          width: "100%",
          height: 72,
          zIndex: 1200,

          backgroundColor: theme.palette.background.paper,
          backgroundImage: "none",

          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[2],

          transition: "box-shadow 180ms ease, background-color 180ms ease",
        })}
      >
        <Container maxWidth="lg" sx={{ height: "100%" }}>
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: -0.5,
              }}
            >
              WorkPulse
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                }}
              >
                Attendance & Payroll System
              </Typography>

              <Button
                variant="contained"
                size="small"
                startIcon={<Login />}
                onClick={handleHeaderLogin}
                className={
                  showHeaderLogin ? "wp-header-login wp-header-login-visible" : "wp-header-login"
                }
                sx={{
                  whiteSpace: "nowrap",
                  borderRadius: 2,
                  fontWeight: 700,

                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 5px 14px rgba(56,189,248,0.2)",
                  },
                }}
              >
                Login
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ------------------------------------------------------------------ */}
      {/* Main                                                               */}
      {/* ------------------------------------------------------------------ */}

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          component="main"
          sx={{
            py: {
              xs: 5,
              md: 6,
            },
          }}
        >
          {/* ---------------------------------------------------------------- */}
          {/* HERO                                                             */}
          {/* ---------------------------------------------------------------- */}

          <Box sx={{ scrollMarginTop: 88 }}>
            <Box
              data-wp-section
              className="wp-section wp-hero-section"
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1.2fr) minmax(360px, 420px)",
                },

                gap: {
                  xs: 5,
                  md: 6,
                },

                alignItems: "start",
              }}
            >
              {/* Hero Content */}
              <Box className="wp-hero-content">
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <Box>
                    <Chip
                      label="WORKPULSE ATTENDANCE"
                      size="small"
                      className="wp-hero-chip"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: 0.5,
                      }}
                    />
                  </Box>

                  <Typography
                    component="h1"
                    className="wp-hero-title"
                    sx={{
                      fontSize: {
                        xs: "2.75rem",
                        sm: "3.5rem",
                        md: "4.25rem",
                      },

                      lineHeight: 1.05,
                      fontWeight: 800,
                      letterSpacing: -2,
                      maxWidth: 700,
                    }}
                  >
                    Simple attendance.
                    <br />
                    Accurate work hours.
                  </Typography>

                  <Typography
                    variant="h6"
                    color="text.secondary"
                    className="wp-hero-description"
                    sx={{
                      maxWidth: 620,
                      fontWeight: 400,
                      lineHeight: 1.6,
                    }}
                  >
                    WorkPulse helps organizations track employee attendance, shifts, breaks, working
                    hours, and reports in one place.
                  </Typography>

                  <Box
                    className="wp-hero-chips"
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Chip icon={<AccessTime />} label="Time Tracking" variant="outlined" />

                    <Chip icon={<CalendarMonth />} label="Shift Management" variant="outlined" />

                    <Chip icon={<Assessment />} label="Reports" variant="outlined" />
                  </Box>

                  <Box
                    sx={{
                      display: {
                        xs: "none",
                        md: "block",
                      },

                      pt: 1,
                    }}
                  >
                    <AttendancePreview />
                  </Box>
                </Box>
              </Box>

              {/* Login Card */}
              <Box
                ref={loginSectionRef}
                sx={{
                  position: "relative",
                  height: "100%",
                  scrollMarginTop: 96,
                }}
              >
                <Paper
                  elevation={0}
                  className="wp-login-card"
                  sx={{
                    width: "100%",
                    maxWidth: 420,
                    mx: "auto",

                    p: {
                      xs: 3,
                      sm: 4,
                    },

                    border: 1,
                    borderColor: "divider",
                    borderRadius: 4,

                    backgroundColor: "background.paper",
                    backgroundImage: "none",

                    position: {
                      xs: "relative",
                      md: "sticky",
                    },

                    top: {
                      xs: "auto",
                      md: 96,
                    },

                    zIndex: 1000,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Clock timezone={getBrowserTimezone()} locale="en-US" variant="inline" />
                    </Box>

                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                        }}
                      >
                        Welcome back
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Sign in to continue to WorkPulse.
                      </Typography>
                    </Box>

                    <Divider />

                    <LoginForm />
                  </Box>
                </Paper>
              </Box>
            </Box>

            {/* Mobile Attendance Preview */}
            <Box
              sx={{
                display: {
                  xs: "block",
                  md: "none",
                },

                mt: 5,
              }}
            >
              <AttendancePreview />
            </Box>
          </Box>

          {/* ---------------------------------------------------------------- */}
          {/* HOW IT WORKS                                                     */}
          {/* ---------------------------------------------------------------- */}

          <Box
            component="section"
            data-wp-section
            className="wp-section"
            sx={{
              pt: {
                xs: 8,
                md: 10,
              },

              scrollMarginTop: 88,
            }}
          >
            <Box
              className="wp-section-heading"
              sx={{
                textAlign: "center",
                mb: 6,
              }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1.5,
                }}
              >
                HOW IT WORKS
              </Typography>

              <Typography
                component="h2"
                variant="h3"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -1,
                  mt: 1,
                }}
              >
                Your workday, made simple.
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  maxWidth: 620,
                  mx: "auto",
                  mt: 2,
                  lineHeight: 1.7,
                }}
              >
                WorkPulse follows your workday from the moment you sign in until you finish your
                shift.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },

                gap: 3,
              }}
            >
              {workflowSteps.map((step, index) => (
                <Paper
                  key={step.number}
                  elevation={0}
                  className={`wp-card wp-workflow-card wp-stagger-${index + 1}`}
                  sx={{
                    p: 3,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 3,
                    height: "100%",

                    backgroundImage: "none",

                    "&:hover": {
                      transform: "translateY(-5px)",
                      borderColor: "rgba(56,189,248,0.3)",
                      boxShadow: "0 12px 26px rgba(0,0,0,0.22)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        className="wp-icon-box"
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,

                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",

                          backgroundColor: "action.hover",
                        }}
                      >
                        {step.icon}
                      </Box>

                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: 1,
                        }}
                      >
                        {step.number}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 0.5,
                        }}
                      >
                        {step.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.6,
                        }}
                      >
                        {step.description}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* ---------------------------------------------------------------- */}
          {/* FEATURES                                                         */}
          {/* ---------------------------------------------------------------- */}

          <Box
            component="section"
            data-wp-section
            className="wp-section"
            sx={{
              pt: {
                xs: 8,
                md: 10,
              },

              scrollMarginTop: 88,
            }}
          >
            <Box
              className="wp-section-heading"
              sx={{
                textAlign: "center",
                mb: 6,
              }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1.5,
                }}
              >
                BUILT FOR THE WORKDAY
              </Typography>

              <Typography
                component="h2"
                variant="h3"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -1,
                  mt: 1,
                }}
              >
                Everything in one place.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },

                gap: 3,
              }}
            >
              {features.map((feature, index) => (
                <Paper
                  key={feature.title}
                  elevation={0}
                  className={`wp-card wp-feature-card wp-stagger-${index + 1}`}
                  sx={{
                    p: 4,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 3,
                    height: "100%",

                    backgroundImage: "none",

                    "&:hover": {
                      transform: "translateY(-5px)",
                      borderColor: "rgba(56,189,248,0.3)",
                      boxShadow: "0 12px 26px rgba(0,0,0,0.22)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Box
                      className="wp-icon-box"
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        backgroundColor: "action.hover",
                      }}
                    >
                      {feature.icon}
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      {feature.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.7,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* ---------------------------------------------------------------- */}
          {/* FOOTER                                                           */}
          {/* ---------------------------------------------------------------- */}

          <Box>
            <Box
              component="footer"
              sx={{
                mt: 10,
                pt: 4,
                pb: 4,

                borderTop: 1,
                borderColor: "divider",

                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                WorkPulse — Attendance & Payroll System
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
