import React, { useState } from "react";
import {
  Bell,
  Clock,
  Shield,
  Save,
  Database,
  Mail,
  Webhook,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/uiLibraries/card";
import { Button } from "../../components/uiLibraries/button";
import { Input } from "../../components/uiLibraries/input";
import { Label } from "../../components/uiLibraries/label";
import { Switch } from "../../components/uiLibraries/switch";
import { Separator } from "../../components/uiLibraries/separator";
// Select component intentionally not used here yet
import { Slider } from "../../components/uiLibraries/slider";
import { toast } from "sonner";
import { useTheme } from "../../hooks/useTheme";
import { getColor } from "../../assets/styles/color";

export const Settings: React.FC = () => {
  useTheme();
  const [pollingInterval, setPollingInterval] = useState([5]);
  const [cpuThreshold, setCpuThreshold] = useState([80]);
  const [memoryThreshold, setMemoryThreshold] = useState([85]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [webhookNotifications, setWebhookNotifications] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Manage daemon settings and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daemon Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Daemon Configuration
              </CardTitle>
              <CardDescription>
                Configure monitoring intervals and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="polling-interval">
                    Polling Interval (seconds)
                  </Label>
                  <span className="text-foreground">{pollingInterval[0]}s</span>
                </div>
                <Slider
                  id="polling-interval"
                  min={1}
                  max={60}
                  step={1}
                  value={pollingInterval}
                  onValueChange={setPollingInterval}
                />
                <p className="text-sm text-muted-foreground">
                  How often the daemon checks container metrics
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cpu-threshold">CPU Alert Threshold (%)</Label>
                  <span className="text-foreground">{cpuThreshold[0]}%</span>
                </div>
                <Slider
                  id="cpu-threshold"
                  min={0}
                  max={100}
                  step={5}
                  value={cpuThreshold}
                  onValueChange={setCpuThreshold}
                />
                <p className="text-sm text-muted-foreground">
                  Create alert when CPU usage exceeds this threshold
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="memory-threshold">
                    Memory Alert Threshold (%)
                  </Label>
                  <span className="text-foreground">{memoryThreshold[0]}%</span>
                </div>
                <Slider
                  id="memory-threshold"
                  min={50}
                  max={100}
                  step={5}
                  value={memoryThreshold}
                  onValueChange={setMemoryThreshold}
                />
                <p className="text-sm text-muted-foreground">
                  Create alert when memory usage exceeds this threshold
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alert Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Alert Rules
              </CardTitle>
              <CardDescription>
                Configure when alerts should be created
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    tokenStyles
                  >
                    <p
                      className="text-sm"
                      style={{ color: getColor("neutral", 200) }}
                    >
                      Alert when containers run with --privileged flag
                    </p>
                  </Button>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Docker Socket Mount Detection</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when /var/run/docker.sock is mounted
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Resource Usage Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when containers exceed resource thresholds
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Container Restart Monitoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when containers restart frequently
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vulnerability Scanning</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when image vulnerabilities are detected
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label>Email Notifications</Label>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                {emailNotifications && (
                  <div className="space-y-2 pl-6">
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      defaultValue="admin@example.com"
                    />
                    <p className="text-sm text-muted-foreground">
                      Receive alert notifications via email
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Slack */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label>Slack Notifications</Label>
                  </div>
                  <Switch
                    checked={slackNotifications}
                    onCheckedChange={setSlackNotifications}
                  />
                </div>
                {slackNotifications && (
                  <div className="space-y-2 pl-6">
                    <Input
                      type="text"
                      placeholder="https://hooks.slack.com/services/..."
                      defaultValue=""
                    />
                    <p className="text-sm text-muted-foreground">
                      Slack webhook URL for notifications
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Webhook */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-muted-foreground" />
                    <Label>Webhook Notifications</Label>
                  </div>
                  <Switch
                    checked={webhookNotifications}
                    onCheckedChange={setWebhookNotifications}
                  />
                </div>
                {webhookNotifications && (
                  <div className="space-y-2 pl-6">
                    <Input
                      type="text"
                      placeholder="https://your-webhook-endpoint.com"
                      defaultValue=""
                    />
                    <p className="text-sm text-muted-foreground">
                      Custom webhook endpoint for alert notifications
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                tokenStyles
              >
                <Database className="h-4 w-4 mr-2" />
                Export Configuration
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Version</p>
                <p className="text-foreground">v1.2.0</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Last Updated
                </p>
                <p className="text-foreground">Oct 15, 2025</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  API Version
                </p>
                <p className="text-foreground">v2.0</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
