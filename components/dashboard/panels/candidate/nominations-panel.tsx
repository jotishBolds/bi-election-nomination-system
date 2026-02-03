"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Eye,
  FileText,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  Ban,
  Plus,
  CreditCard,
  Building,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface MyNomination {
  id: string;
  applicationNo: string;
  status: string;
  submittedAt: string;
  scrutinyStatus?: string;
  scrutinyAt?: string;
  scrutinyRemarks?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  ward: {
    id: string;
    wardNo: number;
    wardName: string;
    reservationStatus: string;
    ulb: {
      id: string;
      name: string;
      district: {
        name: string;
      };
    };
  };
  politicalParty?: {
    name: string;
    shortName: string;
  };
  electionSymbol?: {
    name: string;
    imageUrl?: string;
  };
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
  }>;
}

export function CandidateNominationsPanel() {
  const [nominations, setNominations] = useState<MyNomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNomination, setSelectedNomination] =
    useState<MyNomination | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const fetchNominations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/nominations/my-nominations");
      const result = await response.json();

      if (result.success) {
        setNominations(result.data);
      } else {
        setError(result.error || "Failed to fetch nominations");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode }
    > = {
      DRAFT: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        icon: <Clock className="h-3 w-3" />,
      },
      SUBMITTED: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: <FileText className="h-3 w-3" />,
      },
      UNDER_SCRUTINY: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: <Eye className="h-3 w-3" />,
      },
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: <XCircle className="h-3 w-3" />,
      },
      WITHDRAWN: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: <Ban className="h-3 w-3" />,
      },
      VALID: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        icon: <FileCheck className="h-3 w-3" />,
      },
    };
    const c = config[status] || config.DRAFT;
    return (
      <Badge className={`${c.bg} ${c.text} gap-1`}>
        {c.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const handleViewNomination = (nomination: MyNomination) => {
    setSelectedNomination(nomination);
    setIsDetailDialogOpen(true);
  };

  if (isLoading && nominations.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            My Nominations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View and manage your nomination applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchNominations}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Link href="/nomination">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Nomination
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
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
      ) : nominations.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <FileText className="h-12 w-12 text-slate-300" />
              <div className="text-center">
                <h3 className="font-semibold text-slate-800">
                  No Nominations Yet
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  You haven't submitted any nomination applications.
                </p>
              </div>
              <Link href="/nomination">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Nomination
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {nominations.map((nomination) => (
            <Card
              key={nomination.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewNomination(nomination)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800">
                          {nomination.applicationNo}
                        </h3>
                        {getStatusBadge(nomination.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4" />
                        <span>
                          Ward {nomination.ward.wardNo} -{" "}
                          {nomination.ward.wardName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <Building className="h-4 w-4" />
                        <span>
                          {nomination.ward.ulb.name},{" "}
                          {nomination.ward.ulb.district.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          Submitted:{" "}
                          {new Date(
                            nomination.submittedAt,
                          ).toLocaleDateString()}
                        </div>
                        {nomination.politicalParty && (
                          <Badge variant="outline" className="text-xs">
                            {nomination.politicalParty.shortName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress indicator */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            nomination.paymentStatus === "COMPLETED"
                              ? "bg-green-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span className="text-xs text-slate-500">
                          Payment: {nomination.paymentStatus || "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            nomination.status === "APPROVED" ||
                            nomination.status === "VALID"
                              ? "bg-green-500"
                              : nomination.status === "REJECTED"
                                ? "bg-red-500"
                                : "bg-amber-500"
                          }`}
                        />
                        <span className="text-xs text-slate-500">
                          Scrutiny:{" "}
                          {nomination.scrutinyStatus || nomination.status}
                        </span>
                      </div>
                    </div>
                    {nomination.electionSymbol && (
                      <div className="flex items-center gap-2">
                        {nomination.electionSymbol.imageUrl && (
                          <img
                            src={nomination.electionSymbol.imageUrl}
                            alt={nomination.electionSymbol.name}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <span className="text-xs text-slate-500">
                          {nomination.electionSymbol.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nomination Details</DialogTitle>
            <DialogDescription>
              Application No: {selectedNomination?.applicationNo}
            </DialogDescription>
          </DialogHeader>

          {selectedNomination && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-700 mb-3">
                    Ward Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Ward</span>
                      <span className="text-sm font-medium">
                        Ward {selectedNomination.ward.wardNo} -{" "}
                        {selectedNomination.ward.wardName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">ULB</span>
                      <span className="text-sm font-medium">
                        {selectedNomination.ward.ulb.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">District</span>
                      <span className="text-sm font-medium">
                        {selectedNomination.ward.ulb.district.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">
                        Reservation
                      </span>
                      <Badge>{selectedNomination.ward.reservationStatus}</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-700 mb-3">Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">
                        Application Status
                      </span>
                      {getStatusBadge(selectedNomination.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Payment</span>
                      <Badge
                        variant="outline"
                        className={
                          selectedNomination.paymentStatus === "COMPLETED"
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        {selectedNomination.paymentStatus || "Pending"}
                      </Badge>
                    </div>
                    {selectedNomination.paymentAmount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">
                          Amount Paid
                        </span>
                        <span className="text-sm font-medium">
                          ₹{selectedNomination.paymentAmount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedNomination.politicalParty && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-700 mb-3">
                      Political Affiliation
                    </h4>
                    <p className="text-sm">
                      {selectedNomination.politicalParty.name}
                    </p>
                    {selectedNomination.electionSymbol && (
                      <div className="flex items-center gap-2 mt-2">
                        {selectedNomination.electionSymbol.imageUrl && (
                          <img
                            src={selectedNomination.electionSymbol.imageUrl}
                            alt={selectedNomination.electionSymbol.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <span className="text-sm text-slate-500">
                          Symbol: {selectedNomination.electionSymbol.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedNomination.scrutinyRemarks && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">
                      Scrutiny Remarks
                    </h4>
                    <p className="text-sm text-amber-700">
                      {selectedNomination.scrutinyRemarks}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                {selectedNomination.documents &&
                selectedNomination.documents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedNomination.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-800">
                              {doc.type}
                            </p>
                            <p className="text-sm text-slate-400">
                              {doc.fileName}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No documents uploaded
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div className="w-0.5 h-full bg-slate-200" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-slate-800">
                        Application Submitted
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(
                          selectedNomination.submittedAt,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedNomination.scrutinyAt && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            selectedNomination.status === "APPROVED" ||
                            selectedNomination.status === "VALID"
                              ? "bg-green-500"
                              : selectedNomination.status === "REJECTED"
                                ? "bg-red-500"
                                : "bg-amber-500"
                          }`}
                        />
                        <div className="w-0.5 h-full bg-slate-200" />
                      </div>
                      <div className="pb-4">
                        <p className="font-medium text-slate-800">
                          Scrutiny{" "}
                          {selectedNomination.status === "REJECTED"
                            ? "Rejected"
                            : "Completed"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(
                            selectedNomination.scrutinyAt,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedNomination.status === "VALID" && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          Nomination Valid
                        </p>
                        <p className="text-sm text-slate-500">
                          You are in the final list of contesting candidates
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
