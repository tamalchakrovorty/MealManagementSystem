import Link from "next/link";
import { query } from "@/lib/db";
import { getAdminContext } from "../_lib/helpers";
import { StockTab } from "../tabs/stock-tab";

export default async function StockPage() {
  const { messId } = await getAdminContext();
  const stockItems = await query("SELECT * FROM freezer_stock WHERE mess_id = $1 ORDER BY item", [messId]);

  return (
    <div className="space-y-4 max-w-lg mx-auto pt-4 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-lg font-bold">Freezer Stock</span>
      </div>
      <StockTab messId={messId} stockItems={stockItems || []} />
    </div>
  );
}
