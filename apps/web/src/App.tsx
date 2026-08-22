import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.js";
import { PracticeModeProvider } from "./practice/PracticeModeContext.js";
import { LoginPage } from "./auth/LoginPage.js";
import { RegisterPage } from "./auth/RegisterPage.js";
import { ProtectedRoute } from "./auth/ProtectedRoute.js";
import { PublicOnlyRoute } from "./auth/PublicOnlyRoute.js";
import { NavShell } from "./app/NavShell.js";
import { DashboardPage } from "./app/DashboardPage.js";
import { BookingWizard } from "./booking/BookingWizard.js";
import { TrackingDashboard } from "./tracking/TrackingDashboard.js";
import { BillingPage } from "./billing/BillingPage.js";
import { FleetPage } from "./fleet/FleetPage.js";
import { AdminPage } from "./admin/AdminPage.js";
import { ReportingPage } from "./reporting/ReportingPage.js";

export function App() {
  return (
    <BrowserRouter>
      <PracticeModeProvider>
        <AuthProvider>
          <NavShell>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book"
                element={
                  <ProtectedRoute>
                    <BookingWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tracking"
                element={
                  <ProtectedRoute>
                    <TrackingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute>
                    <BillingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet"
                element={
                  <ProtectedRoute>
                    <FleetPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reporting"
                element={
                  <ProtectedRoute>
                    <ReportingPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </NavShell>
        </AuthProvider>
      </PracticeModeProvider>
    </BrowserRouter>
  );
}
