import { createTheme } from "@mui/material/styles";

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
      paper: "#0f172a",
    },

    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
    },

    divider: "rgba(255,255,255,0.10)",
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: ["Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),

    h1: {
      fontWeight: 800,
    },

    h2: {
      fontWeight: 800,
    },

    h3: {
      fontWeight: 800,
    },

    h4: {
      fontWeight: 700,
    },

    h5: {
      fontWeight: 700,
    },

    h6: {
      fontWeight: 700,
    },

    button: {
      fontWeight: 600,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: "100%",
        },

        body: {
          minHeight: "100vh",
          background: "#020617",
        },

        "*::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },

        "*::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,.15)",
          borderRadius: 999,
        },

        "*::-webkit-scrollbar-track": {
          background: "transparent",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#0f172a",
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,.10)",
          boxShadow: "0 4px 16px rgba(0,0,0,.18)",
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          borderRadius: 10,
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
          borderRadius: 10,
          backgroundColor: "#0b1220",

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
