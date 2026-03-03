"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/lib/auth/types";
import { Suspense, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  LucideIcon,
  Paperclip,
  Shield,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart3,
  ClipboardList,
  FileSearch,
  UserX,
  Trophy,
  FileBarChart,
  Building2,
  MapPin,
  UserCog,
  ScrollText,
  Calendar,
  Vote,
  Landmark,
  History,
  FileStack,
} from "lucide-react";

interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
  iconColor: string;
  iconBgColor: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ROLE_NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  RO: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          iconColor: "text-blue-600",
          iconBgColor: "bg-blue-100",
        },
      ],
    },
    {
      label: "Nomination Management",
      items: [
        {
          title: "Application List",
          icon: ClipboardList,
          href: "/dashboard?tab=applications",
          iconColor: "text-emerald-600",
          iconBgColor: "bg-emerald-100",
        },
        {
          title: "Scrutiny",
          icon: FileSearch,
          href: "/dashboard?tab=scrutiny",
          iconColor: "text-amber-600",
          iconBgColor: "bg-amber-100",
        },
        {
          title: "Withdrawals",
          icon: UserX,
          href: "/dashboard?tab=withdraw",
          iconColor: "text-rose-600",
          iconBgColor: "bg-rose-100",
        },
        {
          title: "Contest List",
          icon: Trophy,
          href: "/dashboard?tab=contest",
          iconColor: "text-purple-600",
          iconBgColor: "bg-purple-100",
        },
        {
          title: "Uncontest List",
          icon: UserX,
          href: "/dashboard?tab=uncontest",
          iconColor: "text-red-600",
          iconBgColor: "bg-red-100",
        },
      ],
    },
    {
      label: "Reports & Analytics",
      items: [
        {
          title: "Reports",
          icon: FileBarChart,
          href: "/dashboard?tab=reports",
          iconColor: "text-indigo-600",
          iconBgColor: "bg-indigo-100",
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Profile Settings",
          icon: Settings,
          href: "/dashboard?tab=profile",
          iconColor: "text-slate-600",
          iconBgColor: "bg-slate-100",
        },
      ],
    },
  ],
  CANDIDATE: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          iconColor: "text-blue-600",
          iconBgColor: "bg-blue-100",
        },
      ],
    },
    {
      label: "Nominations",
      items: [
        {
          title: "My Nominations",
          icon: FileStack,
          href: "/dashboard?tab=nominations",
          iconColor: "text-indigo-600",
          iconBgColor: "bg-indigo-100",
        },
        {
          title: "Submit New",
          icon: FileText,
          href: "/nomination",
          iconColor: "text-emerald-600",
          iconBgColor: "bg-emerald-100",
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Profile Settings",
          icon: Settings,
          href: "/dashboard?tab=profile",
          iconColor: "text-slate-600",
          iconBgColor: "bg-slate-100",
        },
      ],
    },
  ],
  SES: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          iconColor: "text-purple-600",
          iconBgColor: "bg-purple-100",
        },
      ],
    },
    {
      label: "Jurisdiction Management",
      items: [
        {
          title: "Districts",
          icon: MapPin,
          href: "/dashboard?tab=districts",
          iconColor: "text-blue-600",
          iconBgColor: "bg-blue-100",
        },
        {
          title: "ULBs",
          icon: Building2,
          href: "/dashboard?tab=ulbs",
          iconColor: "text-emerald-600",
          iconBgColor: "bg-emerald-100",
        },
        {
          title: "Wards",
          icon: Landmark,
          href: "/dashboard?tab=wards",
          iconColor: "text-cyan-600",
          iconBgColor: "bg-cyan-100",
        },
      ],
    },
    {
      label: "User Management",
      items: [
        {
          title: "RO Management",
          icon: UserCog,
          href: "/dashboard?tab=ro-management",
          iconColor: "text-amber-600",
          iconBgColor: "bg-amber-100",
        },
      ],
    },
    {
      label: "Nominations",
      items: [
        {
          title: "All Nominations",
          icon: ClipboardList,
          href: "/dashboard?tab=nominations",
          iconColor: "text-indigo-600",
          iconBgColor: "bg-indigo-100",
        },
      ],
    },
    {
      label: "Reports",
      items: [
        {
          title: "Reports",
          icon: FileBarChart,
          href: "/dashboard?tab=reports",
          iconColor: "text-rose-600",
          iconBgColor: "bg-rose-100",
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Profile Settings",
          icon: Settings,
          href: "/dashboard?tab=profile",
          iconColor: "text-slate-600",
          iconBgColor: "bg-slate-100",
        },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          iconColor: "text-orange-600",
          iconBgColor: "bg-orange-100",
        },
      ],
    },
    {
      label: "User Management",
      items: [
        {
          title: "Users",
          icon: Users,
          href: "/dashboard?tab=users",
          iconColor: "text-blue-600",
          iconBgColor: "bg-blue-100",
        },
        {
          title: "Roles & Permissions",
          icon: Shield,
          href: "/dashboard?tab=roles",
          iconColor: "text-purple-600",
          iconBgColor: "bg-purple-100",
        },
      ],
    },
    {
      label: "Election Management",
      items: [
        {
          title: "Election Config",
          icon: Settings,
          href: "/dashboard?tab=election-config",
          iconColor: "text-emerald-600",
          iconBgColor: "bg-emerald-100",
        },
        {
          title: "Schedule",
          icon: Calendar,
          href: "/dashboard?tab=schedule",
          iconColor: "text-amber-600",
          iconBgColor: "bg-amber-100",
        },
        {
          title: "Parties & Symbols",
          icon: Vote,
          href: "/dashboard?tab=parties",
          iconColor: "text-rose-600",
          iconBgColor: "bg-rose-100",
        },
        {
          title: "Election Symbols",
          icon: Landmark,
          href: "/dashboard?tab=symbols",
          iconColor: "text-violet-600",
          iconBgColor: "bg-violet-100",
        },
        {
          title: "Voter Roll",
          icon: FileStack,
          href: "/dashboard?tab=voter-roll",
          iconColor: "text-teal-600",
          iconBgColor: "bg-teal-100",
        },
        {
          title: "BR Payments",
          icon: Paperclip,
          href: "/dashboard?tab=br-payments",
          iconColor: "text-orange-600",
          iconBgColor: "bg-orange-100",
        },
      ],
    },
    {
      label: "Content Management",
      items: [
        {
          title: "CMS",
          icon: ScrollText,
          href: "/dashboard?tab=cms",
          iconColor: "text-cyan-600",
          iconBgColor: "bg-cyan-100",
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          title: "Audit Logs",
          icon: History,
          href: "/dashboard?tab=audit-logs",
          iconColor: "text-slate-600",
          iconBgColor: "bg-slate-100",
        },
        {
          title: "Reports",
          icon: FileBarChart,
          href: "/dashboard?tab=reports",
          iconColor: "text-indigo-600",
          iconBgColor: "bg-indigo-100",
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Profile Settings",
          icon: Settings,
          href: "/dashboard?tab=profile",
          iconColor: "text-slate-600",
          iconBgColor: "bg-slate-100",
        },
      ],
    },
  ],
};

const getCandidateNavigation = (
  submissionCount: number,
  maxSubmissions: number,
): NavGroup[] => {
  const submitButtonText =
    submissionCount === 0
      ? "Submit New (1/3)"
      : `Update Nomination (${Math.min(submissionCount + 1, maxSubmissions)}/3)`;

  return [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          iconColor: "text-blue-600",
          iconBgColor: "bg-blue-100",
        },
      ],
    },
    {
      label: "Nominations",
      items: [
        {
          title: "My Nominations",
          icon: FileStack,
          href: "/dashboard?tab=nominations",
          iconColor: "text-indigo-600",
          iconBgColor: "bg-indigo-100",
        },
        ...(submissionCount < maxSubmissions
          ? [
              {
                title: submitButtonText,
                icon: FileText,
                href:
                  submissionCount === 0
                    ? "/nomination"
                    : `/nomination?update=true&submission=${submissionCount + 1}`,
                iconColor:
                  submissionCount === 0 ? "text-emerald-600" : "text-blue-600",
                iconBgColor:
                  submissionCount === 0 ? "bg-emerald-100" : "bg-blue-100",
              },
            ]
          : []),
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Profile Settings",
          icon: Settings,
          href: "/dashboard?tab=profile",
          iconColor: "text-slate-600",
          iconBgColor: "bg-slate-100",
        },
      ],
    },
  ];
};

function DashboardSidebarContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "";
  const [candidateSubmissionData, setCandidateSubmissionData] = useState<{
    count: number;
    maxAllowed: number;
  } | null>(null);

  useEffect(() => {
    if (user?.role === "CANDIDATE") {
      const fetchSubmissionData = async () => {
        try {
          const response = await fetch("/api/dashboard/candidate");
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.submissions) {
              setCandidateSubmissionData({
                count: result.data.submissions.count,
                maxAllowed: result.data.submissions.maxAllowed,
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch submission data:", error);
        }
      };
      fetchSubmissionData();
    }
  }, [user?.role]);

  if (!user) return null;

  const navGroups =
    user.role === "CANDIDATE" && candidateSubmissionData
      ? getCandidateNavigation(
          candidateSubmissionData.count,
          candidateSubmissionData.maxAllowed,
        )
      : ROLE_NAV_CONFIG[user.role];

  return (
    <Sidebar
      className="border-r border-blue-200 !bg-blue-50"
      style={
        {
          "--sidebar-background": "214 100% 97%",
          "--sidebar-foreground": "215 20% 30%",
          "--sidebar-border": "214 32% 91%",
          "--sidebar-accent": "214 80% 94%",
          "--sidebar-accent-foreground": "215 20% 20%",
          "--sidebar-primary": "217 91% 60%",
          "--sidebar-primary-foreground": "0 0% 100%",
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <SidebarHeader className="border-b border-blue-200 bg-blue-100/80 px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/main-logo.png"
            alt="ENS Portal"
            className="h-8 sm:h-10 w-auto"
          />
          <div className="min-w-0">
            <h2 className="font-semibold text-sm sm:text-base text-blue-800 truncate">
              ENS Portal
            </h2>
            <p className="text-[10px] sm:text-xs text-blue-600/70">
              Nomination System
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav Content */}
      <SidebarContent className="px-1.5 sm:px-2 py-2 sm:py-4 bg-blue-50">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] sm:text-xs font-semibold text-blue-600/70 uppercase tracking-wider px-2 sm:px-2 mb-0.5 sm:mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const itemTab = item.href.includes("tab=")
                    ? new URL(item.href, "http://dummy").searchParams.get("tab")
                    : null;

                  const isActive = itemTab
                    ? pathname === "/dashboard" && currentTab === itemTab
                    : item.href === "/dashboard"
                      ? pathname === "/dashboard" && !currentTab
                      : pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname.startsWith(item.href));

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`
                          ${
                            isActive
                              ? "!bg-blue-600 !text-white hover:!bg-blue-700 shadow-sm shadow-blue-200"
                              : "hover:!bg-blue-100 !text-slate-700"
                          }
                        `}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2"
                        >
                          <div
                            className={`p-1 sm:p-1.5 rounded-lg shrink-0 ${
                              isActive ? "bg-white/25" : item.iconBgColor
                            }`}
                          >
                            <item.icon
                              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                                isActive ? "text-white" : item.iconColor
                              }`}
                            />
                          </div>
                          <span className="font-medium text-xs sm:text-sm truncate">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-blue-200 bg-blue-100/50 px-3 sm:px-4 py-2 sm:py-3">
        <p className="text-[10px] sm:text-xs text-blue-600/60 text-center">
          © 2026 Election Commission
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardSidebar() {
  return (
    <Suspense
      fallback={
        <div className="w-[250px] h-full bg-blue-50 border-r border-blue-200 animate-pulse" />
      }
    >
      <DashboardSidebarContent />
    </Suspense>
  );
}
