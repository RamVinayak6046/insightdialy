import React from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BriefingCard({ briefing, loading, canGenerate, onGenerate }) {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">Today's briefing</p>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
          <Button variant="outline" size="sm" disabled={loading || !canGenerate} onClick={onGenerate}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : briefing ? <RefreshCw className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {briefing ? "Regenerate" : "Generate"}
          </Button>
        </div>
        {briefing ? (
          <>
            <h2 className="mb-4 text-2xl font-semibold leading-tight sm:text-3xl">{briefing.headline}</h2>
            <ul className="space-y-2.5">
              {(briefing.points || []).map((p, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed sm:text-base">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-muted-foreground">
            {canGenerate ? "Generate an AI summary of today's top stories." : "Refresh the news first, then generate your AI briefing."}
          </p>
        )}
      </div>
    </section>
  );
}