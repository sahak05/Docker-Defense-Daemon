import React from "react";
import { useDashboardContext } from "../../../context/DashboardContext";
import { ContainerItem } from "./ContainerItem";
import styles from "../styles/dashboard.module.css";

/**
 * ContainersSection
 *
 * Displays grid of top containers with:
 * - Individual ContainerItem components
 * - View All button to navigate to containers page
 */

export const ContainersSection: React.FC = () => {
  const { dashboardData, onNavigate } = useDashboardContext();

  if (!dashboardData) return null;

  const { topContainers } = dashboardData;

  const handleContainerClick = (containerId: string) => {
    onNavigate("containers", containerId);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Top Containers</h2>
        <button
          className={styles.linkButton}
          onClick={() => onNavigate("containers")}
        >
          View All
        </button>
      </div>
      <div className={styles.containersList}>
        {topContainers.map((container) => (
          <ContainerItem
            key={container.id}
            container={container}
            onClick={handleContainerClick}
          />
        ))}
      </div>
    </div>
  );
};

ContainersSection.displayName = "ContainersSection";
