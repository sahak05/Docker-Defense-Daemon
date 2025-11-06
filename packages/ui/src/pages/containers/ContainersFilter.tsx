import React from "react";
import { Input } from "../../components/uiLibraries/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/uiLibraries/select";
import { Button } from "../../components/uiLibraries/button";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Search, Download } from "lucide-react";

interface ContainersFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const ContainersFilter: React.FC<ContainersFilterProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search containers by name, image, or ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="exited">Exited</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
