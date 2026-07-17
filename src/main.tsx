import "./index.css";

import App from "./App.tsx";

import GoogleProvider from "@/providers/GoogleProvider";
import AuthProvider from "@/providers/AuthProvider";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleProvider>
  </StrictMode>,
);
