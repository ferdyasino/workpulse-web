import "./styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import { SnackbarProvider } from "@/components/ui";
import SettingsProvider from "@/providers/SettingsProvider";
import AuthProvider from "@/providers/AuthProvider";
import GoogleProvider from "@/providers/GoogleProvider";
import ThemeProvider from "@/providers/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SnackbarProvider>
        <GoogleProvider>
          <AuthProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </AuthProvider>
        </GoogleProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);
