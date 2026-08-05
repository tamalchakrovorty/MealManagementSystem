import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { MenuViewClient } from "./menu-view-client";

export default async function MenuViewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);
  if (!membership) redirect("/homepage");

  const messId = (membership as any).mess_id;

  const menus = await query(
    "SELECT * FROM menus WHERE mess_id = $1 ORDER BY date DESC LIMIT 62",
    [messId]
  );

  return <MenuViewClient menus={menus as any} />;
}
