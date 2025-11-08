import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/HomePage";
import LearnerPortal from "./pages/LearnerPortal";
import InstitutionPortal from "./pages/InstitutionPortal";
import InstitutionDataManagement from "./pages/InstitutionDataManagement";
import InstitutionReports from "./pages/InstitutionReports";
import InstitutionSettings from "./pages/InstitutionSettings";
import InstitutionLogin from "./pages/InstitutionLogin";
import AdminPortal from "./pages/AdminPortal";
import AdminDataManagement from "./pages/AdminDataManagement";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/learner" element={<LearnerPortal />} />
            <Route path="/login/institution" element={<InstitutionLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route
              path="/institution"
              element={
                <ProtectedRoute allowedRoles={["institution"]}>
                  <InstitutionPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/institution/data-management"
              element={
                <ProtectedRoute allowedRoles={["institution"]}>
                  <InstitutionDataManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/institution/reports"
              element={
                <ProtectedRoute allowedRoles={["institution"]}>
                  <InstitutionReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/institution/settings"
              element={
                <ProtectedRoute allowedRoles={["institution"]}>
                  <InstitutionSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/data-management"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDataManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
