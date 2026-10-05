import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { refreshNews } from "@/lib/refreshNews";
import { summarizeBriefing } from "@/functions/summarizeBriefing";
import { CATEGORIES, todayStr } from "@/lib/news";
import { useArticles, useCounts, useAlerts, useBriefing, useInvalidateNews } from "@/hooks/useNews";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/news/AppHeader";
import BriefingCard from "@/components/news/BriefingCard";
import AlertsStrip from "@/components/news/AlertsStrip";
import CategoryFilters from "@/components/news/CategoryFilters";
import ArticleList from "@/components/news/ArticleList";

const EMPTY = {
  today: "No stories yet today. Press Refresh to pull the latest news.",
  saved: "Nothing saved yet. Tap the bookmark on any story to keep it here.",
  history: "Your news history will build up here as you refresh each day.",
};

export default function Home() {
  const { toast } = useToast();
  const invalidate = useInvalidateNews();
  const [view, setView] = useState("today");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [briefing_loading, setBriefingLoading] = useState(false);

  const articles = useArticles({ view, category, region, search });
  const counts = useCounts();
  const alerts = useAlerts();
  const briefing = useBriefing();

  const refresh = async () => {
    setRefreshing(true);
    const { added, noSources } = await refreshNews(setProgress);
    setRefreshing(false);
    invalidate();
    if (noSources) {
      toast({ title: "No active news sources", description: "Enable a source in Settings first." });
      return;
    }
    toast({ title: added ? `Updated with ${added} stories` : "No new stories found", description: added ? "Your briefing can now be refreshed." : "Try again in a moment." });
  };

  const generateBriefing = async () => {
    setBriefingLoading(true);
    try {
      const { items } = await base44.entities.Article.filter({ fetched_date: todayStr() }, { sort: "-published_at", limit: 24, fields: ["title", "summary", "category"] });
      const res = await summarizeBriefing({ items });
      const data = { date: todayStr(), headline: res.data.headline, points: res.data.points };
      if (briefing.data) await base44.entities.Briefing.update(briefing.data.id, data);
      else await base44.entities.Briefing.create(data);
      invalidate();
    } catch (e) {
      toast({ title: "Couldn't generate the briefing", variant: "destructive" });
    }
    setBriefingLoading(false);
  };

  const toggleBookmark = async (a) => {
    await base44.entities.Article.update(a.id, { bookmarked: !a.bookmarked });
    invalidate();
  };

  return (
    <div className="min-h-screen">
      <AppHeader search={search} onSearch={setSearch} onRefresh={refresh} refreshing={refreshing} progress={progress} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        {view === "today" && !search && (
          <>
            <BriefingCard briefing={briefing.data} loading={briefing_loading} canGenerate={(counts.data?.today || 0) > 0} onGenerate={generateBriefing} />
            <AlertsStrip alerts={alerts.data || []} />
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="today">Today{counts.data ? ` · ${counts.data.today}` : ""}</TabsTrigger>
              <TabsTrigger value="saved">Saved{counts.data ? ` · ${counts.data.saved}` : ""}</TabsTrigger>
              <TabsTrigger value="history">History{counts.data ? ` · ${counts.data.all}` : ""}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={region} onValueChange={setRegion}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="india">India</TabsTrigger>
              <TabsTrigger value="global">Global</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CategoryFilters value={category} onChange={setCategory} />
        <ArticleList
          query={articles}
          groupByDate={view === "history"}
          onToggleBookmark={toggleBookmark}
          emptyText={search ? "No stories match your search." : EMPTY[view]}
        />
      </main>
    </div>
  );
}