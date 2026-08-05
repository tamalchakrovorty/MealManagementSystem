"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { popup } from "@/lib/popup";

export function StockAccessRequest({ messId }: { messId: string }) {
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    const res = await fetch("/api/user/stock-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messId }),
    });
    const data = await res.json();
    if (!res.ok) { popup.error(data.error); }
    else { popup.success("Stock access request sent to manager"); }
    setLoading(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRequest} disabled={loading}>
      {loading ? "Sending..." : "Request Access"}
    </Button>
  );
}
