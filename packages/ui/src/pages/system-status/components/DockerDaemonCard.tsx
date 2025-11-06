import React from "react";
import { Server } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/uiLibraries/card";

interface DockerDaemonCardProps {
  data?: {
    images: number;
    imagesSize: string;
    volumes: number;
    volumesSize: string;
    networks: number;
    networkDetails: string;
  };
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

export const DockerDaemonCard: React.FC<DockerDaemonCardProps> = ({
  data = {
    images: 24,
    imagesSize: "3.2 GB",
    volumes: 18,
    volumesSize: "12.5 GB",
    networks: 5,
    networkDetails: "3 bridge, 2 custom",
  },
}) => {
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
            value={`${data.images} total`}
            detail={data.imagesSize}
          />
          <StatItem
            label="Volumes"
            value={`${data.volumes} total`}
            detail={data.volumesSize}
          />
          <StatItem
            label="Networks"
            value={`${data.networks} total`}
            detail={data.networkDetails}
          />
        </div>
      </CardContent>
    </Card>
  );
};
