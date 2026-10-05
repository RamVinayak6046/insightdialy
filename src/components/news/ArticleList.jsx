import React from "react";
import { Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArticleCard from "@/components/news/ArticleCard";

export default function ArticleList({ query, groupByDate, onToggleBookmark, emptyText }) {
  if (query.isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  const items = query.data?.pages.flatMap((p) => p.items) || [];
  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
        <Inbox className="h-8 w-8" />
        <p className="max-w-xs text-sm">{emptyText}</p>
      </div>
    );
  }
  const groups = groupByDate
    ? Object.entries(items.reduce((m, a) => ((m[a.fetched_date || "Earlier"] ||= []).push(a), m), {}))
    : [[null, items]];
  return (
    <div className="space-y-8">
      {groups.map(([date, list]) => (
        <div key={date || "all"}>
          {date && (
            <h3 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {date === "Earlier" ? date : new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </h3>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => <ArticleCard key={a.id} article={a} onToggleBookmark={onToggleBookmark} />)}
          </div>
        </div>
      ))}
      {query.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Load more
          </Button>
        </div>
      )}
    </div>
  );
}