import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { GuestRoute, ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./layout/AppShell";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { BlogFormPage } from "./pages/BlogFormPage";
import { BlogListPage } from "./pages/BlogListPage";
import { GalleryPage } from "./pages/GalleryPage";
import { InquiriesPage } from "./pages/InquiriesPage";
import { LoginPage } from "./pages/LoginPage";
import { ServiceFormPage } from "./pages/ServiceFormPage";
import { ServicesListPage } from "./pages/ServicesListPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/inquiries" element={<InquiriesPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/new" element={<BlogFormPage />} />
            <Route path="/blog/:id" element={<BlogFormPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/services" element={<ServicesListPage />} />
            <Route path="/services/new" element={<ServiceFormPage />} />
            <Route path="/services/:id" element={<ServiceFormPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/inquiries" replace />} />
      </Routes>
    </AuthProvider>
  );
}
