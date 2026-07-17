import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ThemeProvider from "@/providers/ThemeProvider.tsx";
import GoogleProvider from "@/providers/GoogleProvider";
import AuthProvider from "@/providers/AuthProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <GoogleProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleProvider>
    </ThemeProvider>
  </StrictMode>,
);
