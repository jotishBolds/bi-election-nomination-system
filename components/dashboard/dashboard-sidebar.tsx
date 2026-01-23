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
import { Home, LucideIcon, Paperclip, Shield } from "lucide-react";

interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Simplified navigation - only dashboard for all roles
const ROLE_NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  RO: [
    {
      label: "Overview",
      items: [{ title: "Dashboard", icon: Home, href: "/dashboard" }],
    },
  ],
  CANDIDATE: [
    {
      label: "Overview",
      items: [{ title: "Dashboard", icon: Home, href: "/dashboard" }],
    },
    {
      label: "Actions",
      items: [
        { title: "Submit Nomination", icon: Paperclip, href: "/nomination" },
      ],
    },
  ],
  SES: [
    {
      label: "Overview",
      items: [{ title: "Dashboard", icon: Home, href: "/dashboard" }],
    },
  ],
  SUPER_ADMIN: [
    {
      label: "Overview",
      items: [{ title: "Dashboard", icon: Home, href: "/dashboard" }],
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
          <img src="/main-logo.png" alt="ENS Portal" className="h-10 w-auto" />
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
