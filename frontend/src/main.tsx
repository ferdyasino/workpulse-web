import "./styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import { SnackbarProvider } from "@/components/ui";

import AuthProvider from "@/providers/AuthProvider";
import GoogleProvider from "@/providers/GoogleProvider";
import SettingsProvider from "@/providers/SettingsProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SnackbarProvider>
        <GoogleProvider>
          <AuthProvider>
            <SettingsProvider>
              <WorkspaceProvider>
                <App />
              </WorkspaceProvider>
            </SettingsProvider>
          </AuthProvider>
        </GoogleProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);
