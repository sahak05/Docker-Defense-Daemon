import React, { useEffect, useState } from "react";
import { Server } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/uiLibraries/card";
import { getDockerDaemonInfo } from "../../../utils/dashboard";

interface DockerDaemonData {
  images: { total: number; sizeGb: number };
  volumes: { total: number };
  networks: { total: number; bridge: number; custom: number };
  timestamp: string;
}

const subClass = "text-muted-foreground";
const valueClass = "text-foreground";

const StatItem: React.FC<{
  label: string;
  value: string;
  detail: string;
}> = ({ label, value, detail }) => (
  <div>
    <p className={subClass}>{label}</p>
    <p className={valueClass}>{value}</p>
    <p className="text-sm text-muted-foreground">{detail}</p>
  </div>
);

export const DockerDaemonCard: React.FC = () => {
  const [data, setData] = useState<DockerDaemonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dockerInfo = await getDockerDaemonInfo();
        setData(dockerInfo);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch Docker daemon info";
        setError(message);
        console.error("Error fetching Docker daemon info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Docker Daemon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading Docker daemon info...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Docker Daemon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            {error || "Failed to load Docker daemon info"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Docker Daemon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatItem
            label="Images"
            value={`${data.images.total} total`}
            detail={`${data.images.sizeGb} GB`}
          />
          <StatItem
            label="Volumes"
            value={`${data.volumes.total} total`}
            detail="Volume storage"
          />
          <StatItem
            label="Networks"
            value={`${data.networks.total} total`}
            detail={`${data.networks.bridge} bridge, ${data.networks.custom} custom`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
