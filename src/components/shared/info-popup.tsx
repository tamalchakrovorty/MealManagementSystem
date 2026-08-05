"use client";

import { useEffect, useState } from "react";
import { popup } from "@/lib/popup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

const icons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  error: <AlertCircle className="h-6 w-6 text-red-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
};

export function InfoPopupProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    return popup._subscribe((e) => {
      setMessage(e.message);
      setType(e.type);
      setOpen(true);
    });
  }, []);

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0">
          <DialogHeader>
            <div className="flex items-center gap-3 px-6 pt-6">
              {icons[type]}
              <DialogTitle>{type === "success" ? "Success" : type === "error" ? "Error" : "Info"}</DialogTitle>
            </div>
            <DialogDescription className="px-6 pt-2 text-sm text-muted-foreground">
              {message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end border-t px-6 py-4">
            <Button onClick={() => setOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
