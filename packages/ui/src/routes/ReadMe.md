# Routes Configuration

This folder contains all routing configuration for the application using React Router v6.

## Files Overview

### `constants.ts`

Defines route path constants for type-safe navigation.

```typescript
import { ROUTE_PATHS } from "./constants";
navigate(ROUTE_PATHS.DASHBOARD);
```

### `types.ts`

Defines TypeScript interfaces for routes:

- `RouteMetaData` - Basic route metadata
- `RouteConfig` - Complete route configuration with component

### `routes.config.ts`

Main route configuration file containing:

- `routeConfig[]` - Array of all routes with metadata and components
- `getRouteById()` - Get route by ID
- `getRouteByPath()` - Get route by path
- `getNavigationRoutes()` - Get routes for navigation UI

### `routes.ts`

Converts route config to React Router format:

- `routes[]` - Array of React Router RouteObject
- `fallbackRoute` - 404 fallback route

### `index.ts`

Barrel export for clean imports.

## Usage

### In App.tsx

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { routes, fallbackRoute } from "./routes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route {...fallbackRoute} />
      </Routes>
    </BrowserRouter>
  );
}
```

### In Components

```typescript
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "../routes/constants";

export function MyComponent() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(ROUTE_PATHS.ALERTS)}>View Alerts</button>
  );
}
```

### In Sidebar/Navigation

```typescript
import { getNavigationRoutes } from "../routes/routes.config";

export function Sidebar() {
  const routes = getNavigationRoutes();

  return (
    <nav>
      {routes.map((route) => (
        <Link
          key={route.id}
          to={route.path}
          label={route.label}
          icon={route.icon}
        />
      ))}
    </nav>
  );
}
```

## Adding a New Route

1. Add the route to `routes.config.ts`:

```typescript
{
  id: "new-page",
  path: "/new-page",
  label: "New Page",
  icon: MyIcon,
  component: MyComponent,
  description: "Description here",
}
```

2. The route will automatically be:
   - Available in `routeConfig[]`
   - Converted to React Router format in `routes[]`
   - Available in navigation via `getNavigationRoutes()`

## Best Practices

✅ Always use `ROUTE_PATHS` constants for navigation
✅ Use `useNavigate()` from React Router in components
✅ Use `getRouteById()` or `getRouteByPath()` for dynamic lookups
✅ Keep route definitions in `routes.config.ts` only
✅ Use icon components from lucide-react for consistency

## Future Enhancements

- Route guards (auth, permissions)
- Nested routes support
- Route transitions/animations
- Dynamic breadcrumbs based on current route
- Route-specific error boundaries
