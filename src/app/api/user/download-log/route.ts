import { NextResponse } from "next/server";
import { format, parse, eachMonthOfInterval, eachDayOfInterval } from "date-fns";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { buildWorkbook, type BuildParams, type ExportDay, type ExportMember, type ExportMenuDay } from "@/lib/export-log";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(request.url);
  const messId = url.searchParams.get("messId");
  const scope = url.searchParams.get("scope") === "full" ? "full" : "my";
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!messId) return NextResponse.json({ error: "messId required" }, { status: 400 });
  if (!start || !end || !/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end)) {
    return NextResponse.json({ error: "start and end must be in yyyy-MM format" }, { status: 400 });
  }
  if (start > end) {
    return NextResponse.json({ error: "start month cannot be after end month" }, { status: 400 });
  }

  const membership = await queryOne(
    "SELECT * FROM memberships WHERE user_id = $1 AND mess_id = $2 AND status = 'active' LIMIT 1",
    [user.id, messId]
  );
  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this mess" }, { status: 403 });
  }

  const mess = await queryOne("SELECT name FROM messes WHERE id = $1", [messId]);
  if (!mess) return NextResponse.json({ error: "Mess not found" }, { status: 404 });

  const memberRows = await query(
    `SELECT m.user_id, m.role, p.name FROM memberships m
     LEFT JOIN profiles p ON p.id = m.user_id
     WHERE m.mess_id = $1 AND m.status = 'active'
     ORDER BY m.joined_at ASC`,
    [messId]
  );
  const allMembers: ExportMember[] = memberRows.map((r) => ({
    userId: r.user_id,
    name: r.name || "Unknown",
    role: r.role,
  }));

  const currentProfile = await queryOne("SELECT name FROM profiles WHERE id = $1", [user.id]);
  const currentMember: ExportMember = {
    userId: user.id,
    name: currentProfile?.name || "You",
    role: membership?.role,
  };

  const members = scope === "full" ? allMembers : [currentMember];
  const messName = (mess as any)?.name || "Mess";

  const monthDates = eachMonthOfInterval({
    start: parse(start, "yyyy-MM", new Date()),
    end: parse(end, "yyyy-MM", new Date()),
  });

  const isMy = scope === "my";

  const allDays: ExportDay[] = [];
  const allMenus: ExportMenuDay[] = [];
  let totalMeals = 0;
  let totalExpenses = 0;
  let totalDeposits = 0;

  for (const monthDate of monthDates) {
    const monthStart = format(monthDate, "yyyy-MM-dd");
    const nextMonthStart = format(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1), "yyyy-MM-dd");

    const [mealRows, guestRows, depositRows, expenseRows, menuRows, rateMeals, rateExpenses] =
      await Promise.all([
        isMy
          ? query(
              `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, user_id, quantity FROM meal_entries
               WHERE mess_id = $1 AND user_id = $2 AND is_guest = false AND date >= $3::date AND date < $4::date`,
              [messId, user.id, monthStart, nextMonthStart]
            )
          : query(
              `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, user_id, quantity FROM meal_entries
               WHERE mess_id = $1 AND is_guest = false AND date >= $2::date AND date < $3::date`,
              [messId, monthStart, nextMonthStart]
            ),
        isMy
          ? query(
              `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, user_id, quantity FROM meal_entries
               WHERE mess_id = $1 AND user_id = $2 AND is_guest = true AND date >= $3::date AND date < $4::date`,
              [messId, user.id, monthStart, nextMonthStart]
            )
          : query(
              `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, user_id, quantity FROM meal_entries
               WHERE mess_id = $1 AND is_guest = true AND date >= $2::date AND date < $3::date`,
              [messId, monthStart, nextMonthStart]
            ),
        isMy
          ? query(
              `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, user_id, amount FROM deposits
               WHERE mess_id = $1 AND user_id = $2 AND date >= $3::date AND date < $4::date`,
              [messId, user.id, monthStart, nextMonthStart]
            )
          : query(
              `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, user_id, amount FROM deposits
               WHERE mess_id = $1 AND date >= $2::date AND date < $3::date`,
              [messId, monthStart, nextMonthStart]
            ),
        isMy
          ? query(
              `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, user_id, amount, notes FROM bazar_expenses
               WHERE mess_id = $1 AND user_id = $2 AND date >= $3::date AND date < $4::date`,
              [messId, user.id, monthStart, nextMonthStart]
            )
          : query(
              `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, user_id, amount, notes FROM bazar_expenses
               WHERE mess_id = $1 AND date >= $2::date AND date < $3::date`,
              [messId, monthStart, nextMonthStart]
            ),
        query(
          `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date_str, lunch, dinner FROM menus
           WHERE mess_id = $1 AND date >= $2::date AND date < $3::date ORDER BY date ASC`,
          [messId, monthStart, nextMonthStart]
        ),
        query(
          `SELECT COALESCE(SUM(quantity), 0) AS total FROM meal_entries
           WHERE mess_id = $1 AND is_guest = false AND date >= $2::date AND date < $3::date`,
          [messId, monthStart, nextMonthStart]
        ),
        query(
          `SELECT COALESCE(SUM(amount), 0) AS total FROM bazar_expenses
           WHERE mess_id = $1 AND date >= $2::date AND date < $3::date`,
          [messId, monthStart, nextMonthStart]
        ),
      ]);

    totalMeals += Number(rateMeals[0]?.total || 0);
    totalExpenses += Number(rateExpenses[0]?.total || 0);
    totalDeposits += depositRows.reduce((s: number, d: any) => s + Number(d.amount), 0);

    const mealsByDate = new Map<string, Map<string, number>>();
    const guestsByDate = new Map<string, Map<string, number>>();
    const depositsByDate = new Map<string, Map<string, number>>();
    const expensesByDate = new Map<string, Map<string, number>>();
    const notesByDate = new Map<string, string>();

    for (const m of mealRows) addEntry(mealsByDate, m.date_str, m.user_id, Number(m.quantity));
    for (const g of guestRows) addEntry(guestsByDate, g.date_str, g.user_id, Number(g.quantity));
    for (const d of depositRows) addEntry(depositsByDate, d.date_str, d.user_id, Number(d.amount));
    for (const e of expenseRows) {
      addEntry(expensesByDate, e.date_str, e.user_id, Number(e.amount));
      if ((e.notes as string)?.trim() && !notesByDate.has(e.date_str)) {
        notesByDate.set(e.date_str, (e.notes as string).trim());
      }
    }

    const days: ExportDay[] = eachDayOfInterval({
      start: new Date(monthStart),
      end: new Date(new Date(nextMonthStart).getTime() - 86400000),
    }).map((day) => {
      const key = format(day, "yyyy-MM-dd");
      return {
        date: format(day, "dd MMM yyyy"),
        meals: Object.fromEntries(mealsByDate.get(key) || []),
        guestMeals: Object.fromEntries(guestsByDate.get(key) || []),
        deposits: Object.fromEntries(depositsByDate.get(key) || []),
        expenses: Object.fromEntries(expensesByDate.get(key) || []),
        note: notesByDate.get(key) || "",
      };
    });

    allDays.push(...days);

    for (const m of menuRows) {
      allMenus.push({
        date: format(new Date(`${m.date_str}T00:00:00`), "dd MMM yyyy"),
        lunch: m.lunch || "",
        dinner: m.dinner || "",
      });
    }
  }

  if (allDays.length === 0) {
    const message =
      start === end
        ? "No data found for this month"
        : "No data found for the selected months";
    return NextResponse.json({ error: message }, { status: 404 });
  }

  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;

  const firstMonth = format(monthDates[0], "MMMM yyyy");
  const lastMonth = format(monthDates[monthDates.length - 1], "MMMM yyyy");
  const monthLabel = monthDates.length === 1 ? firstMonth : `${firstMonth} — ${lastMonth}`;

  const params: BuildParams = {
    messName,
    monthLabel,
    scope,
    members,
    days: allDays,
    menus: allMenus,
    mealRate,
    totalDeposits,
    totalExpenses,
  };

  const buffer = Buffer.from(await buildWorkbook(params));
  const filename = `${messName} - ${firstMonth}${monthDates.length > 1 ? ` to ${lastMonth}` : ""}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function addEntry(
  map: Map<string, Map<string, number>>,
  dateKey: string,
  userId: string,
  value: number
) {
  const day = map.get(dateKey) || new Map<string, number>();
  day.set(userId, (day.get(userId) || 0) + value);
  map.set(dateKey, day);
}
