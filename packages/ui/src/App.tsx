import { useState } from "react";

/* App-level components (from this package) */
import { DashboardLayout } from "./components/DashboardLayout";
import { ContainersPage } from "./components/ContainersPage";
import { AlertsCenter } from "./components/AlertsCenter";
import { EventLogs } from "./components/EventLogs";
import { SystemStatus } from "./components/SystemStatus";
import { Settings } from "./components/Settings";

/* Dashboard component kept in the ui package */
import Dashboard from "../../ui/src/pages/dashboard/Dashboard";
import { Toaster } from "./components/uiLibraries/sonner";
import { useTheme } from "./hooks/useTheme";

/* Optional: import shared styles / color tokens / font helpers from ui package
   Uncomment and adapt paths if files exist at these locations:
*/
// import colorTokens from "../ui/src/assets/styles/color";
// import { someUtil } from "../ui/src/utils/utils";
// import "../ui/src/styles/font.css"; // or import font helpers

export default function App() {
  const { isDarkMode, toggle: toggleTheme } = useTheme();

  // App navigation state
  const [currentPage, setCurrentPage] = useState<string>("dashboard");

  // Navigation handler (forwarded into DashboardLayout and Dashboard child)
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        // Pass dark mode handler so Dashboard UI can show toggle and respond
        return (
          <Dashboard
            onToggleDarkMode={toggleTheme}
            onNavigate={handleNavigate}
            useMockData={true}
          />
        );
      case "containers":
        return <ContainersPage />;
      case "alerts":
        // Components read theme via hook; don't prop-drill
        return <AlertsCenter />;
      case "events":
        return <EventLogs />;
      case "system":
        return <SystemStatus />;
      case "settings":
        return <Settings />;
      default:
        return (
          <Dashboard
            onToggleDarkMode={toggleTheme}
            onNavigate={handleNavigate}
            useMockData={true}
          />
        );
    }
  };

  return (
    <>
      <DashboardLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        // DashboardLayout still accepts isDarkMode prop; forward hook values
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleTheme}
      >
        {renderPage()}
      </DashboardLayout>

      <Toaster />
    </>
  );
}
