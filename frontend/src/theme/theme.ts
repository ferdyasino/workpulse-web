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
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,.08)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",

          border: "1px solid rgba(255,255,255,.15)",

          boxShadow: "0 8px 24px rgba(0,0,0,.25)",

          backgroundImage: "none",
        },
      },
    },
  },
});

export default theme;
