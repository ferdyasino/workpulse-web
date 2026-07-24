import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import App from "./App";

import { SnackbarProvider } from "@/components/ui";
import AuthProvider from "@/providers/AuthProvider";
import GoogleProvider from "@/providers/GoogleProvider";
import theme from "@/theme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <SnackbarProvider>
        <GoogleProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </GoogleProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);
