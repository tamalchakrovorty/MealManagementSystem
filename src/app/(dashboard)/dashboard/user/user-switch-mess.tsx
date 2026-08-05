"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Check, ChevronsUpDown } from "lucide-react";
import { popup } from "@/lib/popup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Mess {
  id: string;
  name: string;
  mess_code: string;
  role: string;
  isCreator: boolean;
  status?: string;
  joined_at?: string | null;
}

const ROLE_BADGE: Record<string, string> = {
  manager: "bg-purple-100 text-purple-700",
  moderator: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-600",
};

export function UserSwitchMess({
  messes,
  currentMessId,
  currentMessName,
  currentRole,
}: {
  messes: Mess[];
  currentMessId: string;
  currentMessName: string;
  currentRole: string;
}) {
  const router = useRouter();

  const handleSwitch = async (messId: string) => {
    if (messId === currentMessId) return;
    const res = await fetch("/api/user/switch-mess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      popup.error(data.error || "Failed to switch");
      return;
    }
    popup.success(`Switched to ${data.name}`);
    router.refresh();
  };

  if (messes.length <= 1) return null;

  return (
    <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="w-full flex items-center justify-between gap-2 text-left">
              <div className="min-w-0">
                <div className="text-[13px] text-[#555] font-semibold mb-1">Select My Mess</div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold truncate">{currentMessName}</span>
                  <span className={cn(
                    "text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 shrink-0",
                    ROLE_BADGE[currentRole] || ROLE_BADGE.member
                  )}>
                    {currentRole}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          }
        />
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            {messes.map((mess) => (
              <DropdownMenuItem
                key={mess.id}
                onClick={() => handleSwitch(mess.id)}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="flex flex-col min-w-0">
                    <span className="truncate text-sm">{mess.name}</span>
                    {mess.joined_at && (
                      <span className="text-[11px] text-muted-foreground">
                        Joined {format(new Date(mess.joined_at), "MMM yyyy")}
                      </span>
                    )}
                    {mess.isCreator && (
                      <span className="text-[11px] text-muted-foreground">Created by you</span>
                    )}
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-[10px] font-semibold uppercase rounded-full px-2 py-0.5",
                    ROLE_BADGE[mess.role] || ROLE_BADGE.member
                  )}>
                    {mess.role}
                  </span>
                  {mess.id === currentMessId && <Check className="h-4 w-4 text-primary" />}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
