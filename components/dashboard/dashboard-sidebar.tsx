// components/dashboard/dashboard-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/lib/auth/types";
import { Suspense } from "react";
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
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  UserX,
  Trophy,
  FileBarChart,
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

// Navigation with colorful icons
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
      label: "Management",
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
          title: "Withdraw",
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
      ],
    },
    {
      label: "Reports",
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
      label: "Actions",
      items: [
        {
          title: "Submit Nomination",
          icon: FileText,
          href: "/nomination",
          iconColor: "text-emerald-600",
          iconBgColor: "bg-emerald-100",
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
  ],
};

function DashboardSidebarContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "";

  if (!user) return null;

  const navGroups = ROLE_NAV_CONFIG[user.role];

  return (
    <Sidebar className="border-r border-green-100 bg-gradient-to-b from-green-50 to-slate-50">
      <SidebarHeader className="border-b border-green-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/main-logo-new.png"
            alt="ENS Portal"
            className="h-10 w-auto"
          />
          <div>
            <h2 className="font-semibold text-primary">ENS Portal</h2>
            <p className="text-xs text-muted-foreground">Nomination System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold text-blue-600/70 uppercase tracking-wider px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  // Extract tab from href if present
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
                        className={
                          isActive
                            ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                            : "hover:bg-blue-100/60 text-gray-700"
                        }
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 py-2"
                        >
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive ? "bg-white/25" : item.iconBgColor
                            }`}
                          >
                            <item.icon
                              className={`h-4 w-4 ${
                                isActive ? "text-white" : item.iconColor
                              }`}
                            />
                          </div>
                          <span className="font-medium">{item.title}</span>
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

      <SidebarFooter className="border-t border-blue-100 px-4 py-3">
        <p className="text-xs text-muted-foreground text-center">
          © 2026 Election Commission
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardSidebar() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardSidebarContent />
    </Suspense>
  );
}
