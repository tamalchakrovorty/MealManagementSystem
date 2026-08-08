import Link from "next/link";
import { query } from "@/lib/db";
import { getAdminContext } from "../../_lib/helpers";
import { MealOffRequests } from "./meal-off-requests";

export default async function MealOffOnPage() {
  const { messId } = await getAdminContext();
  const mealRequests = await query(
    `SELECT r.*, p.name FROM requests r LEFT JOIN profiles p ON p.id = r.user_id
     WHERE r.mess_id = $1 AND r.type IN ('meal_off', 'meal_on') ORDER BY r.created_at DESC`,
    [messId]
  );

  return (
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3 pt-5 pb-2">
        <Link
          href="/dashboard/admin"
          className="w-[46px] h-[46px] min-w-[46px] bg-card rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Meal Off/On Requests</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Review and approve meal requests</p>
        </div>
      </div>
      <MealOffRequests requests={mealRequests || []} />
    </div>
  );
}
