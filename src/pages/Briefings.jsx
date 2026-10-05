import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import SubHeader from "@/components/news/SubHeader";
import BriefingHistoryItem from "@/components/news/BriefingHistoryItem";

export default function Briefings() {
  const q = useInfiniteQuery({
    queryKey: ["briefing-history"],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) => base44.entities.Briefing.filter({}, { sort: "-date", limit: 10, cursor: pageParam }),
    getNextPageParam: (p) => (p.has_more ? p.next_cursor : undefined),
  });
  const items = q.data?.pages.flatMap((p) => p.items) || [];
  return (
    <div className="min-h-screen">
      <SubHeader title="Briefing archive" subtitle="Every daily briefing, with the stories behind it" />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {q.isLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        {!q.isLoading && !items.length && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>No briefings yet. Generate today's briefing from the dashboard.</p>
          </div>
        )}
        {items.map((b) => <BriefingHistoryItem key={b.id} briefing={b} />)}
        {q.hasNextPage && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>Load older briefings</Button>
          </div>
        )}
      </main>
    </div>
  );
}