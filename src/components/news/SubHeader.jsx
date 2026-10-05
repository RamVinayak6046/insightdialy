import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubHeader({ title, subtitle, action }) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");
  }, []);
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/" aria-label="Back to dashboard"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="mr-auto">
          <h1 className="text-xl font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}