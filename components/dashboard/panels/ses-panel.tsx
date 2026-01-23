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
import {
  Eye,
  CheckCircle,
  FileText,
  MapPin,
  Users,
  AlertTriangle,
} from "lucide-react";

const electionStats = [
  { label: "Active Elections", value: "12", icon: MapPin },
  { label: "Total ROs", value: "48", icon: Users },
  { label: "Pending Actions", value: "23", icon: AlertTriangle },
  { label: "Reports Generated", value: "156", icon: FileText },
];

const pendingActions = [
  {
    id: 1,
    type: "Station Change",
    ro: "John Smith",
    district: "Chennai",
    priority: "high",
  },
  {
    id: 2,
    type: "Candidate Approval",
    ro: "Sarah Lee",
    district: "Coimbatore",
    priority: "medium",
  },
  {
    id: 3,
    type: "Resource Request",
    ro: "Mike Chen",
    district: "Madurai",
    priority: "low",
  },
];

export function SESPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          State Election Commission Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor elections and approve administrative actions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {electionStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Pending RO Actions
            </CardTitle>
            <CardDescription>
              Review and approve officer requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{action.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {action.ro} • {action.district}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        action.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : action.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }
                    >
                      {action.priority}
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary-hover"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Election Monitoring
            </CardTitle>
            <CardDescription>
              Real-time election status across districts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Elections on Track</span>
                <span className="text-green-700 font-bold">9</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">Minor Issues</span>
                <span className="text-yellow-700 font-bold">2</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Requires Attention</span>
                <span className="text-red-700 font-bold">1</span>
              </div>
            </div>
            <Button className="w-full mt-6 bg-primary hover:bg-primary-hover">
              <FileText className="mr-2 h-4 w-4" />
              Generate Full Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
