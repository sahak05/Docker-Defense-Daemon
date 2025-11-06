/**
 * ContainerAlert type
 *
 * Represents an alert from container inspection/analysis
 * Includes action taken, container metadata, detected risks, and vulnerability scan results
 */

export interface ContainerAlert {
  action: string;
  id: string;
  image: string;
  log_time: string;
  metadata?: Record<string, any>;
  risks: Array<{
    description: string;
    rule?: string;
    severity: "critical" | "high" | "medium" | "low" | string;
  }>;
  trivy?: {
    count: number;
    high_or_critical: number;
    sample?: any[];
  };
}
