import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { JoinMessClient } from "./join-mess-client";

export const dynamic = "force-dynamic";

export default async function JoinMessPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <Suspense>
      <JoinMessClient />
    </Suspense>
  );
}
