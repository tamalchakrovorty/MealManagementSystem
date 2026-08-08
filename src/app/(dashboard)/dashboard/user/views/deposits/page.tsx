import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { DepositsViewClient } from "./deposits-view-client";

export const dynamic = "force-dynamic";

export default async function DepositsViewPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const month = params.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const membership = await getSelectedMembership(user.id);
  if (!membership) redirect("/homepage");

  const messId = (membership as any).mess_id;

  const [deposits, expenses] = await Promise.all([
    query(
      `SELECT d.*, p.name as member_name, p.avatar_url FROM deposits d
       LEFT JOIN profiles p ON p.id = d.user_id
       WHERE d.mess_id = $1 AND d.date >= ($2 || '-01')::date AND d.date < (($2 || '-01')::date + INTERVAL '1 month')
       ORDER BY d.date DESC`,
      [messId, month]
    ),
    query(
      `SELECT be.*, p.name as member_name, p.avatar_url FROM bazar_expenses be
       LEFT JOIN profiles p ON p.id = be.user_id
       WHERE be.mess_id = $1 AND be.date >= ($2 || '-01')::date AND be.date < (($2 || '-01')::date + INTERVAL '1 month')
       ORDER BY be.date DESC`,
      [messId, month]
    ),
  ]);

  return (
    <div className="min-h-screen">
      <div className="max-w-lg md:max-w-5xl mx-auto">
        <Suspense>
          <DepositsViewClient
            deposits={deposits || []}
            expenses={expenses || []}
            currentUserId={user.id}
            currentMonth={month}
          />
        </Suspense>
      </div>
    </div>
  );
}
