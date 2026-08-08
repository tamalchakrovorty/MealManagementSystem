"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, LayoutDashboard, Settings, Eye } from "lucide-react";

interface BottomNavProps {
  isManagerOrModerator: boolean;
  unreadCount: number;
}

export function BottomNav({ isManagerOrModerator, unreadCount }: BottomNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/homepage", label: "Home", icon: Home },
    { href: "/notifications", label: "Alerts", icon: Bell },
    { href: "/dashboard/user/views", label: "Views", icon: Eye },
    { href: "/dashboard/user", label: "Profile", icon: LayoutDashboard },
  ];

  if (isManagerOrModerator) {
    links.push({ href: "/dashboard/admin", label: "Admin", icon: Settings });
  }

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 md:hidden bottom-nav-glass">
      <div className="flex items-center justify-center gap-2 px-2 py-2">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "?");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
            >
              <div className="relative">
                <link.icon className="h-6 w-6" />
                {link.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
