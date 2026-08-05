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
    <div className="space-y-4 max-w-lg mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-lg font-bold">Meal Off/On</span>
      </div>
      <MealOffRequests requests={mealRequests || []} />
    </div>
  );
}
