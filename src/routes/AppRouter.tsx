import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "@/features/auth/pages/LoginPage";
import NotFoundPage from "@/features/common/pages/NotFoundPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
