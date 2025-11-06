import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import colors, { getColor } from "../../assets/styles/color";
import { Container, Menu, X, Moon, Sun } from "lucide-react";
import { getNavigationRoutes } from "../../routes";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

/**
 * DashboardLayout
 *
 * Main layout component with sidebar navigation powered by React Router
 * - Uses useNavigate() for page navigation
 * - Uses useLocation() to determine current page
 * - Uses getNavigationRoutes() for sidebar items
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localDarkMode, setLocalDarkMode] = useState(false);
  const themeHook = useTheme();

  // Get navigation routes from config
  const navItems = getNavigationRoutes();

  // Effective dark mode: prefer prop from App, fallback to theme hook, then local state
  const darkMode =
    typeof isDarkMode === "boolean"
      ? isDarkMode
      : typeof themeHook.isDarkMode === "boolean"
      ? themeHook.isDarkMode
      : localDarkMode;

  const handleToggle = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
    } else if (themeHook.toggle) {
      themeHook.toggle();
    } else {
      setLocalDarkMode((v) => !v);
    }
  };

  // Determine if route is active
  const isRouteActive = (path: string): boolean => {
    return location.pathname === path;
  };

  // Root and sidebar inline styles driven by tokens to ensure strict bg/text colors
  const rootStyle: React.CSSProperties = {
    backgroundColor: darkMode
      ? colors.background.dark.primary
      : colors.background.light.primary,
    color: darkMode ? colors.text.dark.primary : colors.text.light.primary,
  };

  const sidebarStyle: React.CSSProperties = {
    backgroundColor: darkMode
      ? colors.background.dark.tertiary
      : colors.background.light.primary,
    borderColor: darkMode ? colors.border.dark : colors.border.light,
    color: darkMode ? colors.text.dark.primary : colors.text.light.primary,
  };

  // Helper that returns className and inline style for nav buttons so we can use token-driven accents
  const navButtonClass = (isActive: boolean) => ({
    className: `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer`,
    style: isActive
      ? {
          backgroundColor: darkMode
            ? getColor("primary", 700, true)
            : getColor("primary", 50, false),
          color: isActive
            ? darkMode
              ? "#fff"
              : getColor("primary", 700, false)
            : undefined,
        }
      : {
          color: darkMode
            ? colors.text.dark.secondary
            : colors.text.light.secondary,
        },
  });

  return (
    <div className="min-h-screen" style={rootStyle}>
      {/* Sidebar for desktop */}
      <aside
        className="fixed left-0 top-0 h-full w-64 border-r hidden lg:block"
        style={sidebarStyle}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Container
              className="h-6 w-6"
              color={darkMode ? colors.primary[300] : colors.primary[600]}
            />
            <span
              style={{
                color: darkMode
                  ? colors.text.dark.primary
                  : colors.text.light.primary,
              }}
            >
              Docker Monitor
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon as React.ComponentType<any>;
              const isActive = isRouteActive(item.path);
              const btn = navButtonClass(isActive);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={btn.className}
                  style={btn.style}
                >
                  <Icon
                    className="h-5 w-5"
                    color={
                      isActive
                        ? darkMode
                          ? "#fff"
                          : getColor("primary", 700)
                        : darkMode
                        ? colors.text.dark.secondary
                        : colors.text.light.secondary
                    }
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 h-full w-64"
            style={{
              backgroundColor: darkMode
                ? colors.background.dark.tertiary
                : colors.background.light.primary,
              borderColor: darkMode ? colors.border.dark : colors.border.light,
              color: darkMode
                ? colors.text.dark.primary
                : colors.text.light.primary,
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Container
                    className="h-6 w-6"
                    color={darkMode ? colors.primary[300] : colors.primary[600]}
                  />
                  <span className={"text-foreground"}>Docker Monitor</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={"p-1 hover:bg-muted/50 rounded"}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1 cursor-pointer">
                {navItems.map((item) => {
                  const Icon = item.icon as React.ComponentType<any>;
                  const isActive = isRouteActive(item.path);
                  const btn = navButtonClass(isActive);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={btn.className}
                      style={btn.style}
                    >
                      <Icon
                        className="h-5 w-5"
                        color={
                          isActive
                            ? darkMode
                              ? "#fff"
                              : getColor("primary", 700)
                            : darkMode
                            ? colors.text.dark.secondary
                            : colors.text.light.secondary
                        }
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className={"sticky top-0 z-40 bg-background"}>
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className={"p-2 hover:bg-muted/50 rounded-lg lg:hidden"}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={handleToggle}
                className={"hidden sm:flex p-2 hover:bg-muted/50 rounded"}
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <Sun
                    size={22}
                    color={getColor("warning", "700", isDarkMode)}
                  />
                ) : (
                  <Moon className="h-5 w-5 text-foreground" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
