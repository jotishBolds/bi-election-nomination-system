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
  Building2,
  Users,
  FileCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const stats = [
  {
    label: "Polling Stations",
    value: "247",
    icon: Building2,
    trend: "+12 this week",
  },
  {
    label: "Pending Approvals",
    value: "18",
    icon: FileCheck,
    trend: "5 urgent",
  },
  {
    label: "Registered Candidates",
    value: "156",
    icon: Users,
    trend: "+8 today",
  },
  { label: "Voter Turnout", value: "67.4%", icon: BarChart3, trend: "+2.3%" },
];

const pendingApprovals = [
  {
    id: 1,
    name: "Ramesh Kumar",
    constituency: "Chennai North",
    status: "pending",
  },
  {
    id: 2,
    name: "Priya Sharma",
    constituency: "Chennai South",
    status: "pending",
  },
  {
    id: 3,
    name: "Arun Patel",
    constituency: "Chennai Central",
    status: "review",
  },
];

export function ROPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Returning Officer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage polling stations and candidate approvals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Candidate Approvals</CardTitle>
            <CardDescription>
              Review and approve candidate nominations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {candidate.constituency}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        candidate.status === "pending" ? "secondary" : "outline"
                      }
                    >
                      {candidate.status}
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
            <Button variant="ghost" className="w-full mt-4">
              View All Approvals <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Polling Station Overview</CardTitle>
            <CardDescription>
              Status of assigned polling stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Active Stations</span>
                <Badge className="bg-green-100 text-green-800">198</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Setup in Progress</span>
                <Badge className="bg-yellow-100 text-yellow-800">32</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Requires Attention</span>
                <Badge className="bg-red-100 text-red-800">17</Badge>
              </div>
            </div>
            <Button className="w-full mt-6 bg-primary hover:bg-primary-hover">
              Manage Stations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
