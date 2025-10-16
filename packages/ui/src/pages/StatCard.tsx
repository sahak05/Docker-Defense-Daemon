import React from "react";
import { Card, CardContent } from "../components/uiLibraries/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  details?: Array<{ label: string; value: string; color?: string }>;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  iconColor,
  iconBgColor,
  title,
  value,
  subtitle,
  subtitleColor = "text-muted-foreground",
  details = [],
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow" tokenStyles>
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`${iconBgColor} p-2 rounded-lg`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <span className="text-muted-foreground uppercase tracking-wide text-sm">
            {title}
          </span>
        </div>

        <div className="mb-2">
          <div className="text-foreground">{value}</div>
        </div>

        {subtitle && (
          <div className={`text-sm ${subtitleColor}`}>{subtitle}</div>
        )}

        {details.length > 0 && (
          <div className="mt-3 space-y-1">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {detail.color && (
                  <div className={`h-2 w-2 rounded-full ${detail.color}`} />
                )}
                <span className="text-muted-foreground">{detail.label}</span>
                <span className={detail.color || "text-foreground"}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
