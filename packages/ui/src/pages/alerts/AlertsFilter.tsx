import React from "react";
import { Search, Download } from "lucide-react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Input } from "../../components/uiLibraries/input";
import { Button } from "../../components/uiLibraries/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/uiLibraries/select";

interface AlertsFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  severityFilter: string;
  onSeverityChange: (severity: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export const AlertsFilter: React.FC<AlertsFilterProps> = ({
  searchTerm,
  onSearchChange,
  severityFilter,
  onSeverityChange,
  statusFilter,
  onStatusChange,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts by type, container, or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={severityFilter} onValueChange={onSeverityChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" tokenStyles>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
