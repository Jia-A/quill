"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/atoms/Button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      square
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground"
      aria-label="Toggle theme"
      icon={
        theme === "dark" ? (
          <Sun className="w-[18px] h-[18px]" />
        ) : (
          <Moon className="w-[18px] h-[18px]" />
        )
      }
    />
  );
}
