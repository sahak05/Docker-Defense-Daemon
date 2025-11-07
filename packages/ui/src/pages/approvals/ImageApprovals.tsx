import React, { useState, useEffect } from "react";
import { Check, X, Loader, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/uiLibraries/card";
import { Button } from "../../components/uiLibraries/button";
import { Badge } from "../../components/uiLibraries/badge";
import { useTheme } from "../../hooks/useTheme";
import {
  getImageApprovalStatus,
  approveImage,
  denyImage,
} from "../../utils/dashboard";
import { toast } from "sonner";
import colors from "../../assets/styles/color";

interface ImageApprovalItem {
  imageKey: string;
  imageName: string;
  status: "pending" | "approved" | "denied";
  lastUpdated?: string;
}

export const ImageApprovals: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [images, setImages] = useState<ImageApprovalItem[]>([
    // Mock data - in production, this would come from backend
    {
      imageKey: "alpine:3.18",
      imageName: "Alpine Linux 3.18",
      status: "pending",
    },
    {
      imageKey: "nginx:latest",
      imageName: "NGINX Latest",
      status: "approved",
      lastUpdated: new Date(Date.now() - 86400000).toLocaleString(),
    },
    {
      imageKey: "postgres:15",
      imageName: "PostgreSQL 15",
      status: "pending",
    },
    {
      imageKey: "redis:7",
      imageName: "Redis 7",
      status: "denied",
      lastUpdated: new Date(Date.now() - 172800000).toLocaleString(),
    },
  ]);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Fetch approval status on mount
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        for (const image of images) {
          try {
            const status = await getImageApprovalStatus(image.imageKey);
            setImages((prev) =>
              prev.map((img) =>
                img.imageKey === image.imageKey
                  ? {
                      ...img,
                      status: status.approved ? "approved" : "denied",
                      lastUpdated: new Date().toLocaleString(),
                    }
                  : img
              )
            );
          } catch (error) {
            console.error(
              `Failed to fetch status for ${image.imageKey}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch image statuses:", error);
      }
    };

    if (images.length > 0) {
      fetchStatuses();
    }
  }, []);

  const handleApprove = async (imageKey: string, imageName: string) => {
    setLoadingImages((prev) => new Set([...prev, imageKey]));
    try {
      await approveImage(imageKey);
      setImages((prev) =>
        prev.map((img) =>
          img.imageKey === imageKey
            ? {
                ...img,
                status: "approved",
                lastUpdated: new Date().toLocaleString(),
              }
            : img
        )
      );
      toast.success(`Image "${imageName}" approved successfully`);
    } catch (error) {
      console.error("Failed to approve image:", error);
      toast.error(`Failed to approve "${imageName}"`);
    } finally {
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(imageKey);
        return next;
      });
    }
  };

  const handleDeny = async (imageKey: string, imageName: string) => {
    setLoadingImages((prev) => new Set([...prev, imageKey]));
    try {
      await denyImage(imageKey);
      setImages((prev) =>
        prev.map((img) =>
          img.imageKey === imageKey
            ? {
                ...img,
                status: "denied",
                lastUpdated: new Date().toLocaleString(),
              }
            : img
        )
      );
      toast.success(`Image "${imageName}" denied successfully`);
    } catch (error) {
      console.error("Failed to deny image:", error);
      toast.error(`Failed to deny "${imageName}"`);
    } finally {
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(imageKey);
        return next;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return {
          backgroundColor: isDarkMode
            ? colors.success[900]
            : colors.success[50],
          borderColor: isDarkMode ? colors.success[700] : colors.success[200],
          textColor: isDarkMode ? colors.success[200] : colors.success[700],
        };
      case "denied":
        return {
          backgroundColor: isDarkMode ? colors.error[900] : colors.error[50],
          borderColor: isDarkMode ? colors.error[700] : colors.error[200],
          textColor: isDarkMode ? colors.error[200] : colors.error[700],
        };
      default:
        return {
          backgroundColor: isDarkMode
            ? colors.warning[900]
            : colors.warning[50],
          borderColor: isDarkMode ? colors.warning[700] : colors.warning[200],
          textColor: isDarkMode ? colors.warning[200] : colors.warning[700],
        };
    }
  };

  const pendingCount = images.filter((img) => img.status === "pending").length;
  const approvedCount = images.filter(
    (img) => img.status === "approved"
  ).length;
  const deniedCount = images.filter((img) => img.status === "denied").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Image Approvals</h1>
        <p className="text-muted-foreground">
          Manage image approval status for container security
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600 mb-2">
                {pendingCount}
              </div>
              <p className="text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">
                {approvedCount}
              </div>
              <p className="text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-error-600 mb-2">
                {deniedCount}
              </div>
              <p className="text-muted-foreground">Denied</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image List */}
      <Card>
        <CardHeader>
          <CardTitle>Container Images</CardTitle>
          <CardDescription>
            Review and approve container images before they can be used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {images.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No images to review</p>
              </div>
            ) : (
              images.map((image) => {
                const isLoading = loadingImages.has(image.imageKey);
                const statusColor = getStatusColor(image.status);

                return (
                  <div
                    key={image.imageKey}
                    style={{
                      backgroundColor: statusColor.backgroundColor,
                      borderColor: statusColor.borderColor,
                    }}
                    className="rounded-lg border p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p
                          className="font-medium"
                          style={{ color: statusColor.textColor }}
                        >
                          {image.imageName}
                        </p>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor:
                              image.status === "approved"
                                ? colors.success[100]
                                : image.status === "denied"
                                ? colors.error[100]
                                : colors.warning[100],
                            color:
                              image.status === "approved"
                                ? colors.success[700]
                                : image.status === "denied"
                                ? colors.error[700]
                                : colors.warning[700],
                            borderColor:
                              image.status === "approved"
                                ? colors.success[200]
                                : image.status === "denied"
                                ? colors.error[200]
                                : colors.warning[200],
                          }}
                        >
                          {image.status === "approved"
                            ? "Approved"
                            : image.status === "denied"
                            ? "Denied"
                            : "Pending"}
                        </Badge>
                      </div>
                      <p
                        className="text-sm"
                        style={{ color: statusColor.textColor, opacity: 0.8 }}
                      >
                        {image.imageKey}
                      </p>
                      {image.lastUpdated && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: statusColor.textColor, opacity: 0.6 }}
                        >
                          Last updated: {image.lastUpdated}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant={
                          image.status === "approved" ? "default" : "outline"
                        }
                        onClick={() =>
                          handleApprove(image.imageKey, image.imageName)
                        }
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline ml-1">Approve</span>
                      </Button>

                      <Button
                        size="sm"
                        variant={
                          image.status === "denied" ? "default" : "outline"
                        }
                        onClick={() =>
                          handleDeny(image.imageKey, image.imageName)
                        }
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline ml-1">Deny</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card
        style={{
          backgroundColor: isDarkMode ? colors.info[900] : colors.info[50],
          borderColor: isDarkMode ? colors.info[700] : colors.info[200],
        }}
      >
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle
              className="h-5 w-5 shrink-0 mt-0.5"
              style={{
                color: isDarkMode ? colors.info[300] : colors.info[600],
              }}
            />
            <div>
              <p
                className="font-medium text-sm mb-1"
                style={{
                  color: isDarkMode ? colors.info[200] : colors.info[700],
                }}
              >
                Image Approval Policy
              </p>
              <p
                className="text-sm"
                style={{
                  color: isDarkMode ? colors.info[300] : colors.info[600],
                }}
              >
                Approved images can be deployed to containers. Denied images
                will be prevented from running. Review the security scan results
                before approving any image.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
