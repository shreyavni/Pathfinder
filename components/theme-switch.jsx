"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

const ThemSwitch = () => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle color theme"
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-950 shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      {mounted && (isDark ? <SunIcon /> : <MoonIcon />)}
    </button>
  );
};

export default ThemSwitch;
