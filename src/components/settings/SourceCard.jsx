import React from "react";
import { Pencil, Trash2, Rss, Sparkles, Plug } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_MAP, timeAgo } from "@/lib/news";

const TYPES = {
  ai_search: { label: "AI web search", icon: Sparkles },
  rss: { label: "RSS feed", icon: Rss },
  rest_api: { label: "News API", icon: Plug },
};

export default function SourceCard({ source, onToggle, onEdit, onDelete }) {
  const t = TYPES[source.type] || TYPES.ai_search;
  const cats = source.categories?.length ? source.categories.map((k) => CATEGORY_MAP[k]?.label).join(", ") : "All categories";
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="rounded-xl bg-secondary p-2.5"><t.icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{source.name}</span>
            <Badge variant="outline" className="text-[11px] font-normal">{t.label}</Badge>
            {source.type !== "ai_search" && <Badge variant="secondary" className="text-[11px] font-normal">Awaiting connector</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{cats} · {source.frequency}</p>
          <p className="truncate text-xs text-muted-foreground">
            {source.endpoint_url || source.preferred_domains || "Any publisher"}
            {source.last_fetched_at ? ` · last fetched ${timeAgo(source.last_fetched_at)}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 self-end sm:self-auto">
        <Switch checked={!!source.enabled} onCheckedChange={(v) => onToggle(source, v)} aria-label="Enable source" />
        <Button variant="ghost" size="icon" onClick={() => onEdit(source)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(source)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}