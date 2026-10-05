import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Search, RefreshCw, Newspaper, BookOpen, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AppHeader({ search, onSearch, onRefresh, refreshing, progress }) {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Newspaper className="h-5 w-5" />
          </div>
          <span className="hidden font-heading text-xl font-semibold sm:block">Daybreak</span>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search headlines…" className="rounded-full bg-card pl-9" />
        </div>
        <Button onClick={onRefresh} disabled={refreshing} size="sm" className="rounded-full">
          <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{refreshing ? progress : "Refresh"}</span>
        </Button>
        <Button asChild variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex">
          <Link to="/briefings" aria-label="Briefing archive"><BookOpen className="h-5 w-5" /></Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/settings" aria-label="News sources settings"><Settings className="h-5 w-5" /></Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle dark mode" className="rounded-full">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}