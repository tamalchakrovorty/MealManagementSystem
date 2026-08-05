import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { MessCodeClient } from "./mess-code-client";

export default async function MessCodePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);
  if (!membership) redirect("/homepage");

  const mess = await queryOne(
    "SELECT * FROM messes WHERE id = $1",
    [(membership as any).mess_id]
  );
  if (!mess) redirect("/homepage");

  return <MessCodeClient messCode={(mess as any).mess_code} />;
}
