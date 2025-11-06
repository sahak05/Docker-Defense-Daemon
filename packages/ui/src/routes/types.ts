import React from "react";

export interface RouteMetaData {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
}

export interface RouteConfig {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  description?: string;
}
