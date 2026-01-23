"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  Vote,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const documents = [
  { name: "Identity Proof", status: "approved", date: "Jan 15, 2026" },
  { name: "Address Proof", status: "approved", date: "Jan 15, 2026" },
  { name: "Nomination Form", status: "pending", date: "Jan 20, 2026" },
  { name: "Affidavit", status: "required", date: null },
];

export function CandidatePanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Candidate Dashboard</h1>
        <p className="text-muted-foreground">
          Track your election status and submissions
        </p>
      </div>

      <Alert className="border-primary/20 bg-primary-light">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Action Required</AlertTitle>
        <AlertDescription>
          Your affidavit document is pending submission. Please upload before
          January 25, 2026.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Application Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-yellow-100 text-yellow-800 text-lg px-3 py-1">
              Under Review
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: Jan 20, 2026
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3/4</div>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Days Until Election
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">42</div>
            <p className="text-xs text-muted-foreground">March 5, 2026</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Status
            </CardTitle>
            <CardDescription>Track your submitted documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {doc.status === "approved" && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {doc.status === "pending" && (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    {doc.status === "required" && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      {doc.date && (
                        <p className="text-xs text-muted-foreground">
                          {doc.date}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      doc.status === "approved" ? "default" : "secondary"
                    }
                    className={
                      doc.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : doc.status === "required"
                          ? "bg-red-100 text-red-800"
                          : ""
                    }
                  >
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Submit required election documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium">Drop files here or click to upload</p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary-hover">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
