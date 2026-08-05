"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { popup } from "@/lib/popup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AccessibleMess } from "@/lib/server-utils";

const ROLE_BADGE: Record<string, string> = {
  manager: "bg-purple-100 text-purple-700",
  moderator: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-600",
};

export function MessSwitcher({
  messes,
  currentMessId,
}: {
  messes: AccessibleMess[];
  currentMessId: string | null;
}) {
  const router = useRouter();
  const current = messes.find((m) => m.id === currentMessId) || messes[0];
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleSwitch = async (messId: string) => {
    if (messId === currentMessId) return;
    const res = await fetch("/api/user/switch-mess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      popup.error(data.error || "Failed to switch mess");
      return;
    }
    popup.success(`Switched to ${data.name || "mess"}`);
    router.refresh();
  };

  if (!current) return null;

  if (!mounted) {
    return (
      <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-muted transition-colors max-w-[200px] text-left">
        <span className="font-bold text-lg truncate">{current.name}</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-muted transition-colors max-w-[200px] text-left">
            <span className="font-bold text-lg truncate">{current.name}</span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            Switch Mess
            <p className="text-xs text-muted-foreground font-normal">
              Messes you have access to
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {messes.map((mess) => (
            <DropdownMenuItem
              key={mess.id}
              onClick={() => handleSwitch(mess.id)}
              className="flex items-start justify-between gap-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex flex-col min-w-0">
                  <span className="truncate">{mess.name}</span>
                  {mess.isCreator && (
                    <span className="text-[11px] text-muted-foreground">Created by you</span>
                  )}
                </span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase rounded-full px-2 py-0.5",
                    ROLE_BADGE[mess.role] || ROLE_BADGE.member
                  )}
                >
                  {mess.role}
                </span>
                {mess.id === currentMessId && <Check className="h-4 w-4 text-primary" />}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
