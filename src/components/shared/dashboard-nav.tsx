"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MessSwitcher } from "@/components/shared/mess-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { popup } from "@/lib/popup";
import type { AccessibleMess } from "@/lib/server-utils";
import {
  Home,
  Bell,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  UtensilsCrossed,
  ShoppingCart,
  DollarSign,
  ClipboardList,
  Megaphone,
  Snowflake,
  Users,
  FileText,
  Eye,
  Building2,
} from "lucide-react";

interface NavProps {
  profile: any;
  membership: any;
  mess: any;
  isManagerOrModerator: boolean;
  userEmail?: string;
  unreadCount: number;
  accessibleMesses: AccessibleMess[];
}

export function DashboardNav({
  profile,
  membership,
  mess,
  isManagerOrModerator,
  userEmail,
  unreadCount,
  accessibleMesses,
}: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    popup.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  const userLinks = [
    { href: "/homepage", label: "Homepage", icon: Home },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/user/views", label: "Views", icon: Eye },
    { href: "/dashboard/user", label: "My Dashboard", icon: LayoutDashboard },
  ];

  const adminLinks = isManagerOrModerator
    ? [
        { href: "/dashboard/admin", label: "Admin Dashboard", icon: Settings },
      ]
    : [];

  const navLinks = [...userLinks, ...adminLinks];

  const showSwitcher = accessibleMesses.length > 1 || (accessibleMesses.length === 1 && !membership);

  return (
    <header className="sticky top-0 z-50 border-b bg-background" suppressHydrationWarning>
      <div className="flex h-14 items-center px-4 gap-4">
        {mounted && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 border-b">
              {showSwitcher ? (
                <MessSwitcher messes={accessibleMesses} currentMessId={mess?.id || null} />
              ) : (
                <>
                  <p className="font-semibold flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {mess?.name || "No Mess"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mess?.mess_code ? `Code: ${mess.mess_code}` : ""}
                  </p>
                </>
              )}
            </div>
            <nav className="flex flex-col p-2 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="relative">
                    <link.icon className="h-4 w-4" />
                    {link.href === "/notifications" && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  {link.label}
                </Link>
              ))}
              {isManagerOrModerator && (
                <>
                  <div className="my-2 border-t" />
                  <p className="px-3 text-xs font-medium text-muted-foreground">
                    Admin Quick Links
                  </p>
                  <AdminSidebarLinks pathname={pathname} onNavigate={() => setSheetOpen(false)} />
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        )}

        {showSwitcher ? (
          <MessSwitcher messes={accessibleMesses} currentMessId={mess?.id || null} />
        ) : (
          <Link href="/homepage" className="font-bold text-lg flex items-center gap-1.5">
            <Building2 className="h-5 w-5" />
            {mess?.name || "MMS"}
          </Link>
        )}

        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {link.label}
                {link.href === "/notifications" && unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {mounted && <ThemeToggle />}
          {mess && membership && (
            <span className="hidden sm:inline text-xs text-muted-foreground capitalize">
              {membership.role}
            </span>
          )}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="rounded-full" />
                }
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.name || "User"} className="h-8 w-8 rounded-full object-cover bg-[#ddd]" />
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    {profile?.name || "User"}
                    <p className="text-xs text-muted-foreground font-normal">
                      {userEmail || ""}
                    </p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/user")}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

function AdminSidebarLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const links = [
    { href: "/dashboard/admin", label: "Overview", icon: Settings },
    { href: "/dashboard/admin?tab=meals", label: "Meals", icon: UtensilsCrossed },
    { href: "/dashboard/admin?tab=bazar", label: "Bazar", icon: ShoppingCart },
    { href: "/dashboard/admin?tab=deposits", label: "Deposits", icon: DollarSign },
    { href: "/dashboard/admin?tab=requests", label: "Requests", icon: ClipboardList },
    { href: "/dashboard/admin?tab=notices", label: "Notices", icon: Megaphone },
    { href: "/dashboard/admin?tab=stock", label: "Freezer Stock", icon: Snowflake },
    { href: "/dashboard/admin?tab=menu", label: "Menu", icon: FileText },
    { href: "/dashboard/admin?tab=members", label: "Members", icon: Users },
  ];

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === link.href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </>
  );
}
