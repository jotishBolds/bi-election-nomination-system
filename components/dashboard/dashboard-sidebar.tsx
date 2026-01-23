// components/dashboard/dashboard-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/lib/auth/types";
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
  Building2,
  Users,
  FileCheck,
  BarChart3,
  Upload,
  Vote,
  Eye,
  CheckCircle,
  FileText,
  Settings,
  UserCog,
  Shield,
  Home,
  LucideIcon,
  Paperclip,
} from "lucide-react";

interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ROLE_NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  RO: [
    {
      label: "Overview",
      items: [{ title: "Dashboard", icon: Home, href: "/dashboard" }],
    },
    {
      label: "Station Management",
      items: [
        {
          title: "Polling Stations",
          icon: Building2,
          href: "/dashboard/polling-stations",
        },
        {
          title: "Approve Candidates",
          icon: FileCheck,
          href: "/dashboard/approve-candidates",
        },
        {
          title: "Election Results",
          icon: BarChart3,
          href: "/dashboard/results",
        },
      ],
    },
  ],
  CANDIDATE: [
    {
      label: "Overview",
      items: [{ title: "Dashboard", icon: Home, href: "/dashboard" }],
    },
    {
      label: "My Campaign",
      items: [
        { title: "Submit Nomination", icon: Paperclip, href: "/nomination" },
        {
          title: "Election Status",
          icon: Eye,
          href: "/dashboard/election-status",
        },
        {
          title: "Upload Documents",
          icon: Upload,
          href: "/dashboard/documents",
        },
        {
          title: "Vote Tracking",
          icon: Vote,
          href: "/dashboard/vote-tracking",
        },
      ],
    },
  ],
  SES: [
    {
      label: "Overview",
      items: [{ title: "Dashboard", icon: Home, href: "/dashboard" }],
    },
    {
      label: "Election Oversight",
      items: [
        { title: "Monitor Elections", icon: Eye, href: "/dashboard/monitor" },
        {
          title: "Approve RO Actions",
          icon: CheckCircle,
          href: "/dashboard/approve-actions",
        },
        {
          title: "Generate Reports",
          icon: FileText,
          href: "/dashboard/reports",
        },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      label: "Overview",
      items: [{ title: "Dashboard", icon: Home, href: "/dashboard" }],
    },
    {
      label: "Administration",
      items: [
        { title: "User Management", icon: Users, href: "/dashboard/users" },
        { title: "Role Assignment", icon: UserCog, href: "/dashboard/roles" },
        { title: "System Config", icon: Settings, href: "/dashboard/settings" },
      ],
    },
  ],
};

export function DashboardSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navGroups = ROLE_NAV_CONFIG[user.role];

  return (
    <Sidebar className="border-r bg-white">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-primary">ENS Portal</h2>
            <p className="text-xs text-muted-foreground">Government of India</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={
                          isActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-sidebar-hover"
                        }
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-3"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
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

      <SidebarFooter className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground text-center">
          © 2026 Election Commission
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
