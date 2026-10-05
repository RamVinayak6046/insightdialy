import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ArticleCard from "@/components/news/ArticleCard";

export default function BriefingHistoryItem({ briefing }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const day = new Date(briefing.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const stories = useQuery({
    queryKey: ["day-articles", briefing.date],
    enabled: open,
    queryFn: async () => (await base44.entities.Article.filter({ fetched_date: briefing.date }, { sort: "-published_at", limit: 60 })).items,
  });
  const toggle = async (a) => {
    await base44.entities.Article.update(a.id, { bookmarked: !a.bookmarked });
    qc.invalidateQueries({ queryKey: ["day-articles", briefing.date] });
  };
  return (
    <section className="rounded-2xl border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">{day}</p>
      <h2 className="mb-3 mt-1 text-xl font-semibold leading-snug">{briefing.headline}</h2>
      <ul className="space-y-2">
        {(briefing.points || []).map((p, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{p}
          </li>
        ))}
      </ul>
      <button onClick={() => setOpen(!open)} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        {open ? "Hide" : "Show"} stories from this day
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {stories.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {stories.data?.map((a) => <ArticleCard key={a.id} article={a} onToggleBookmark={toggle} />)}
          {stories.data && !stories.data.length && <p className="text-sm text-muted-foreground">No stories stored for this day.</p>}
        </div>
      )}
    </section>
  );
}