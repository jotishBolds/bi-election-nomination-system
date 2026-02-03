"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Calendar,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Save,
  Lock,
  Unlock,
  Edit,
  CheckCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ElectionConfig {
  id: string;
  name: string;
  year: number;
  type: string;
  notificationDate: string;
  nominationStartDate: string;
  nominationEndDate: string;
  scrutinyDate: string;
  withdrawalStartDate: string;
  withdrawalEndDate: string;
  symbolAllotmentDate?: string;
  pollDate?: string;
  countingDate?: string;
  resultDate?: string;
  dailyStartTime: string;
  dailyEndTime: string;
  nominationFee: number;
  scStFeeDiscount: number;
  maxNominationsPerCandidate: number;
  maxProposersRequired: number;
  currentPhase: string;
  isActive: boolean;
  isLocked: boolean;
}

export function ElectionConfigPanel() {
  const [config, setConfig] = useState<ElectionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedConfig, setEditedConfig] = useState<Partial<ElectionConfig>>({});
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/election-config");
      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
        setEditedConfig(result.data);
      } else {
        setError(result.error || "Failed to fetch election config");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/election-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedConfig),
      });
      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
        setIsEditing(false);
      } else {
        alert(result.error || "Failed to save configuration");
      }
    } catch {
      alert("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLock = async () => {
    try {
      const response = await fetch("/api/admin/election-config/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !config?.isLocked }),
      });
      const result = await response.json();

      if (result.success) {
        fetchConfig();
        setIsLockDialogOpen(false);
      } else {
        alert(result.error || "Failed to toggle lock");
      }
    } catch {
      alert("Failed to toggle lock");
    }
  };

  const formatDateForInput = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "PRE_NOTIFICATION":
        return "bg-slate-100 text-slate-700";
      case "NOMINATION":
        return "bg-emerald-100 text-emerald-700";
      case "SCRUTINY":
        return "bg-amber-100 text-amber-700";
      case "WITHDRAWAL":
        return "bg-orange-100 text-orange-700";
      case "POLLING":
        return "bg-blue-100 text-blue-700";
      case "RESULTS":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-slate-600">{error}</p>
        <Button onClick={fetchConfig} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Settings className="h-12 w-12 text-slate-400" />
        <p className="text-slate-600">No election configuration found</p>
        <Button>Create Configuration</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Election Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage election dates, fees, and settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedConfig(config);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsLockDialogOpen(true)}
                disabled={config.isLocked}
              >
                {config.isLocked ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Locked
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Lock Config
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                disabled={config.isLocked}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Settings className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{config.name}</p>
                <p className="text-sm text-slate-500">
                  {config.type} • Year {config.year}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getPhaseColor(config.currentPhase)}>
                {config.currentPhase.replace(/_/g, " ")}
              </Badge>
              {config.isActive && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              {config.isLocked && (
                <Badge className="bg-red-100 text-red-700">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Important Dates */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 rounded-lg">
                <Calendar className="h-4 w-4 text-rose-600" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Important Dates
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">
                  Notification Date
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formatDateForInput(editedConfig.notificationDate)}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        notificationDate: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {new Date(config.notificationDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">
                  Nomination Start
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formatDateForInput(editedConfig.nominationStartDate)}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        nominationStartDate: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {new Date(config.nominationStartDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">Nomination End</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formatDateForInput(editedConfig.nominationEndDate)}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        nominationEndDate: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {new Date(config.nominationEndDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">Scrutiny Date</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formatDateForInput(editedConfig.scrutinyDate)}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        scrutinyDate: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {new Date(config.scrutinyDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">
                  Withdrawal Start
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formatDateForInput(editedConfig.withdrawalStartDate)}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        withdrawalStartDate: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {new Date(config.withdrawalStartDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">Withdrawal End</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formatDateForInput(editedConfig.withdrawalEndDate)}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        withdrawalEndDate: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {new Date(config.withdrawalEndDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">Poll Date</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formatDateForInput(editedConfig.pollDate)}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        pollDate: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {config.pollDate
                      ? new Date(config.pollDate).toLocaleDateString()
                      : "—"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">Counting Date</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formatDateForInput(editedConfig.countingDate)}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        countingDate: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {config.countingDate
                      ? new Date(config.countingDate).toLocaleDateString()
                      : "—"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <Settings className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-sm font-semibold">Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">
                  Daily Start Time
                </Label>
                {isEditing ? (
                  <Input
                    type="time"
                    value={editedConfig.dailyStartTime}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        dailyStartTime: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {config.dailyStartTime}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">Daily End Time</Label>
                {isEditing ? (
                  <Input
                    type="time"
                    value={editedConfig.dailyEndTime}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        dailyEndTime: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {config.dailyEndTime}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">Nomination Fee</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedConfig.nominationFee}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        nominationFee: parseInt(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    ₹{config.nominationFee}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">
                  SC/ST Fee Discount (%)
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedConfig.scStFeeDiscount}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        scStFeeDiscount: parseInt(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {config.scStFeeDiscount}%
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">
                  Max Nominations per Candidate
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedConfig.maxNominationsPerCandidate}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        maxNominationsPerCandidate: parseInt(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {config.maxNominationsPerCandidate}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-500">
                  Max Proposers Required
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedConfig.maxProposersRequired}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        maxProposersRequired: parseInt(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {config.maxProposersRequired}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lock Dialog */}
      <Dialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Election Configuration</DialogTitle>
            <DialogDescription>
              {config.isLocked
                ? "Unlocking will allow changes to the election configuration. This action will be logged."
                : "Locking will prevent any changes to the election configuration. This is typically done after the election process begins."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleLock}
              variant={config.isLocked ? "default" : "destructive"}
            >
              {config.isLocked ? "Unlock Configuration" : "Lock Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
