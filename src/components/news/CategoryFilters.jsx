import React from "react";
import { CATEGORIES } from "@/lib/news";

export default function CategoryFilters({ value, onChange }) {
  const base = "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors";
  const on = "border-primary bg-primary text-primary-foreground";
  const off = "bg-card text-muted-foreground hover:text-foreground";
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <button onClick={() => onChange("all")} className={`${base} ${value === "all" ? on : off}`}>All</button>
      {CATEGORIES.map((c) => (
        <button key={c.key} onClick={() => onChange(c.key)} className={`${base} ${value === c.key ? on : off}`}>
          <c.icon className="h-3.5 w-3.5" />
          {c.label}
        </button>
      ))}
    </div>
  );
}