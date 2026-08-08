"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const options = [
  { value: "light" as const, icon: Sun },
  { value: "dark" as const, icon: Moon },
  { value: "system" as const, icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="theme-switcher">
        <div className="theme-switcher_switch">
          <Sun className="icon h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="theme-switcher">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`theme-switcher_switch ${theme === opt.value ? "active" : ""}`}
        >
          <opt.icon className="icon h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
