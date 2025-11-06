import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./pages/components/DashboardLayout";
import { Toaster } from "./components/uiLibraries/sonner";
import { useTheme } from "./hooks/useTheme";
import { routes, fallbackRoute } from "./routes";

/**
 * App
 *
 * Main application component with React Router v6 integration
 *
 * - BrowserRouter enables client-side routing
 * - Routes maps URL paths to page components
 * - DashboardLayout wraps all pages with sidebar, header, etc.
 * - Theme is managed via useTheme hook and passed to layout
 */
export default function App() {
  const { isDarkMode, toggle: toggleTheme } = useTheme();

  return (
    <BrowserRouter>
      <DashboardLayout isDarkMode={isDarkMode} onToggleDarkMode={toggleTheme}>
        <Routes>
          {/* Map all configured routes */}
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          {/* 404 Fallback - redirects to dashboard */}
          <Route path={fallbackRoute.path} element={fallbackRoute.element} />
        </Routes>
      </DashboardLayout>

      {/* Toast notifications */}
      <Toaster />
    </BrowserRouter>
  );
}
