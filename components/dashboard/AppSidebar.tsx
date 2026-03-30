"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Role } from "@prisma/client";
import { toast } from "sonner";

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
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Icons (inline SVG — no icon-library dependency)
// ---------------------------------------------------------------------------

function HomeIcon()     { return <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a.5.5 0 01-.5.5h-3.75v-3.75h-3.5V14.5H2.5A.5.5 0 012 14V6.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>; }
function FolderIcon()   { return <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none"><path d="M1.5 4.5A1.5 1.5 0 013 3h3.379a1.5 1.5 0 011.06.44l.622.62H13A1.5 1.5 0 0114.5 5.5v7A1.5 1.5 0 0113 14H3a1.5 1.5 0 01-1.5-1.5v-8z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>; }
function NoteIcon()     { return <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none"><path d="M3 2.5A1.5 1.5 0 014.5 1h7A1.5 1.5 0 0113 2.5v11a.5.5 0 01-.777.416L8 11.101l-4.223 2.815A.5.5 0 013 13.5v-11z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>; }
function UsersIcon()    { return <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.25"/><path d="M1 13c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><circle cx="12" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M14.5 13c0-1.933-1.12-3-3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>; }
function LogOutIcon()   { return <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ShieldIcon()   { return <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none"><path d="M8 1L2 3.5v4C2 11 5 13.5 8 15c3-1.5 6-4 6-7.5v-4L8 1z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></svg>; }
function ActivityIcon() { return <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="currentColor" strokeWidth="1.25"/><path d="M8 4.25v4l2.75 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>; }
function ApprovalsIcon(){ return <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none"><path d="M3 2.5h10v11H3v-11z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/><path d="M5 5h6M5 7.5h6M5 10h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>; }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SidebarUser {
  id:    string;
  name:  string | null | undefined;
  email: string | null | undefined;
  role:  Role;
}

interface NavItem {
  label: string;
  href:  string;
  icon:  React.ReactNode;
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

const ROLE_BADGE_VARIANT: Record<Role, "default" | "secondary" | "outline" | "destructive"> = {
  SUPERADMIN: "destructive",
  ADMIN:      "default",
  MODERATOR:  "secondary",
  USER:       "outline",
  INTERN:     "outline",
};

const ADMIN_ROLES = new Set<Role>([Role.ADMIN, Role.SUPERADMIN]);

/** Dashboard + Activity — Moderator and above (not vault-only users). */
const ELEVATED_ROLES = new Set<Role>([Role.SUPERADMIN, Role.ADMIN, Role.MODERATOR]);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppSidebarProps {
  user: SidebarUser;
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const vaultOnly = user.role === Role.USER || user.role === Role.INTERN;

  const mainNav: NavItem[] = vaultOnly
    ? [
        { label: "Projects",      href: "/dashboard/projects", icon: <FolderIcon /> },
        { label: "General Notes", href: "/dashboard/notes",    icon: <NoteIcon />   },
      ]
    : [
        { label: "Dashboard",     href: "/dashboard",          icon: <HomeIcon />   },
        ...(ELEVATED_ROLES.has(user.role)
          ? [{ label: "Activity", href: "/dashboard/activity", icon: <ActivityIcon /> } as const]
          : []),
        { label: "Projects",      href: "/dashboard/projects", icon: <FolderIcon /> },
        { label: "General Notes", href: "/dashboard/notes",    icon: <NoteIcon />   },
      ];

  const homeHref = vaultOnly ? "/dashboard/projects" : "/dashboard";

  const adminNav: NavItem[] = [
    { label: "User Management", href: "/dashboard/users",       icon: <UsersIcon />  },
    { label: "Approvals",       href: "/dashboard/approvals",   icon: <ApprovalsIcon /> },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
    toast.success("Signed out successfully.");
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          render={
            <Link href={item.href} className="flex items-center gap-2.5">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          }
        />
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" variant="inset">

      {/* Header */}
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3">
        <Link href={homeHref} className="flex items-center gap-2 font-semibold text-sm group-data-[collapsible=icon]:hidden">
          <ShieldIcon />
          <span>Credential Vault</span>
        </Link>
        <SidebarTrigger className="-mr-1" />
      </SidebarHeader>

      <SidebarSeparator />

      {/* Main navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => <NavLink key={item.href} item={item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin-only section */}
        {ADMIN_ROLES.has(user.role) && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNav.map((item) => <NavLink key={item.href} item={item} />)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer — user info + sign out */}
      <SidebarSeparator />
      <SidebarFooter className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium leading-tight">
              {user.name ?? "Unnamed User"}
            </span>
            <span className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
              {user.email}
            </span>
            <Badge
              variant={ROLE_BADGE_VARIANT[user.role]}
              className="mt-1.5 w-fit text-[10px] py-0"
            >
              {user.role}
            </Badge>
          </div>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Sign out"
                >
                  <LogOutIcon />
                </Button>
              }
            />
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>

    </Sidebar>
  );
}
