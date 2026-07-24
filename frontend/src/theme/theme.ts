import { alpha, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",

    primary: {
      main: "#38bdf8",
    },

    secondary: {
      main: "#64748b",
    },

    success: {
      main: "#22c55e",
    },

    warning: {
      main: "#f59e0b",
    },

    error: {
      main: "#ef4444",
    },

    background: {
      default: "#020617",
      paper: alpha("#ffffff", 0.08),
    },

    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
    },
  },

  shape: {
    borderRadius: 18,
  },

  typography: {
    fontFamily: ["Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: "100%",
        },

        body: {
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #1e293b 0%, #020617 70%)",
          backgroundAttachment: "fixed",
        },

        "*::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },

        "*::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,.15)",
          borderRadius: 999,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,.08)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,.15)",
          backgroundImage: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,.25)",
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: "rgba(255,255,255,.05)",

          "& fieldset": {
            borderColor: "rgba(255,255,255,.12)",
          },

          "&:hover fieldset": {
            borderColor: "rgba(255,255,255,.24)",
          },

          "&.Mui-focused fieldset": {
            borderColor: "#38bdf8",
          },
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: "auto",
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            color: "#cbd5e1",
            fontWeight: 700,
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255,255,255,.08)",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
