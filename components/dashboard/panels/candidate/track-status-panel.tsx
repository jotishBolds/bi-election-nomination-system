"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  FileText,
  MapPin,
  CreditCard,
  Eye,
  Loader2,
  ArrowRight,
  Phone,
  Building,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface TrackingNomination {
  id: string;
  applicationNo: string;
  status: string;
  submittedAt: string;
  paymentStatus?: string;
  paymentAt?: string;
  scrutinyStatus?: string;
  scrutinyAt?: string;
  scrutinyRemarks?: string;
  withdrawalAt?: string;
  validAt?: string;
  ward: {
    wardNo: number;
    wardName: string;
    ulb: {
      name: string;
    };
  };
  roOfficer?: {
    name: string;
    phone: string;
  };
}

interface StatusStep {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending" | "error";
  timestamp?: string;
}

export function TrackStatusPanel() {
  const [nominations, setNominations] = useState<TrackingNomination[]>([]);
  const [selectedNomination, setSelectedNomination] =
    useState<TrackingNomination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNominations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/nominations/track-status");
      const result = await response.json();

      if (result.success) {
        setNominations(result.data);
        if (result.data.length > 0 && !selectedNomination) {
          setSelectedNomination(result.data[0]);
        }
      } else {
        setError(result.error || "Failed to fetch tracking data");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [selectedNomination]);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const getStatusSteps = (nomination: TrackingNomination): StatusStep[] => {
    const steps: StatusStep[] = [
      {
        key: "submitted",
        label: "Application Submitted",
        description: "Your nomination form has been submitted successfully",
        icon: <FileText className="h-5 w-5" />,
        status: "completed",
        timestamp: nomination.submittedAt,
      },
      {
        key: "payment",
        label: "Payment",
        description: "Security deposit and processing fee",
        icon: <CreditCard className="h-5 w-5" />,
        status:
          nomination.paymentStatus === "COMPLETED"
            ? "completed"
            : nomination.paymentStatus === "FAILED"
              ? "error"
              : nomination.status === "SUBMITTED" && !nomination.paymentStatus
                ? "current"
                : "pending",
        timestamp: nomination.paymentAt,
      },
      {
        key: "scrutiny",
        label: "Scrutiny",
        description: "Document verification by Returning Officer",
        icon: <Eye className="h-5 w-5" />,
        status:
          nomination.status === "APPROVED" ||
          nomination.status === "VALID" ||
          nomination.status === "REJECTED"
            ? nomination.status === "REJECTED"
              ? "error"
              : "completed"
            : nomination.status === "UNDER_SCRUTINY"
              ? "current"
              : "pending",
        timestamp: nomination.scrutinyAt,
      },
      {
        key: "result",
        label: "Final Result",
        description:
          nomination.status === "REJECTED"
            ? "Application rejected"
            : nomination.status === "WITHDRAWN"
              ? "Application withdrawn"
              : "Nomination approved for contest",
        icon:
          nomination.status === "REJECTED" ||
          nomination.status === "WITHDRAWN" ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <FileCheck className="h-5 w-5" />
          ),
        status:
          nomination.status === "VALID"
            ? "completed"
            : nomination.status === "REJECTED" ||
                nomination.status === "WITHDRAWN"
              ? "error"
              : nomination.status === "APPROVED"
                ? "current"
                : "pending",
        timestamp: nomination.validAt || nomination.withdrawalAt,
      },
    ];

    return steps;
  };

  const getOverallProgress = (nomination: TrackingNomination): number => {
    const steps = getStatusSteps(nomination);
    const completedSteps = steps.filter((s) => s.status === "completed").length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  if (isLoading && nominations.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-slate-600">{error}</p>
              <Button onClick={fetchNominations} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (nominations.length === 0) {
    return (
      <div className="p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <FileText className="h-12 w-12 text-slate-300" />
              <div className="text-center">
                <h3 className="font-semibold text-slate-800">
                  No Applications to Track
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Submit a nomination application to track its status here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Track Application Status
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time tracking of your nomination application
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchNominations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Application Selector (if multiple) */}
      {nominations.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                Select Application:
              </span>
              <Select
                value={selectedNomination?.id}
                onValueChange={(id) =>
                  setSelectedNomination(
                    nominations.find((n) => n.id === id) || null,
                  )
                }
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nominations.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.applicationNo} - Ward {n.ward.wardNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedNomination && (
        <>
          {/* Overview Card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                      {selectedNomination.applicationNo}
                    </h2>
                    <Badge
                      className={
                        selectedNomination.status === "VALID"
                          ? "bg-emerald-100 text-emerald-700"
                          : selectedNomination.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : selectedNomination.status === "WITHDRAWN"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-blue-100 text-blue-700"
                      }
                    >
                      {selectedNomination.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Ward {selectedNomination.ward.wardNo} -{" "}
                      {selectedNomination.ward.wardName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                    <Building className="h-4 w-4" />
                    <span>{selectedNomination.ward.ulb.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Overall Progress</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {getOverallProgress(selectedNomination)}%
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Progress
                  value={getOverallProgress(selectedNomination)}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-700">
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getStatusSteps(selectedNomination).map((step, index, arr) => (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : step.status === "current"
                              ? "bg-blue-100 text-blue-600"
                              : step.status === "error"
                                ? "bg-red-100 text-red-600"
                                : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {step.status === "current" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : step.status === "completed" ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : step.status === "error" ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      {index < arr.length - 1 && (
                        <div
                          className={`w-0.5 h-16 ${
                            step.status === "completed"
                              ? "bg-green-200"
                              : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-medium ${
                            step.status === "completed"
                              ? "text-green-700"
                              : step.status === "current"
                                ? "text-blue-700"
                                : step.status === "error"
                                  ? "text-red-700"
                                  : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </h4>
                        {step.timestamp && (
                          <span className="text-xs text-slate-400">
                            {new Date(step.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {step.description}
                      </p>

                      {step.key === "scrutiny" &&
                        selectedNomination.scrutinyRemarks && (
                          <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-700">
                              <strong>Remarks:</strong>{" "}
                              {selectedNomination.scrutinyRemarks}
                            </p>
                          </div>
                        )}

                      {step.status === "current" && step.key === "payment" && (
                        <Button className="mt-3" size="sm">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Complete Payment
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          {selectedNomination.roOfficer && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-700">
                  Returning Officer Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {selectedNomination.roOfficer.name}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Phone className="h-3 w-3" />
                      {selectedNomination.roOfficer.phone}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  For any queries regarding your nomination, please contact the
                  assigned Returning Officer.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Processing Time</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Scrutiny typically takes 2-3 working days after payment
                    confirmation. You will receive SMS notifications for status
                    updates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
