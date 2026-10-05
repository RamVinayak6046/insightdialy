import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { todayStr } from "@/lib/news";

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function useArticles({ view, category, region, search }) {
  const query = {};
  if (view === "today") query.fetched_date = todayStr();
  if (view === "saved") query.bookmarked = true;
  if (category !== "all") query.category = category;
  if (region !== "all") query.region = region;
  if (search.trim()) query.title = { $regex: escapeRe(search.trim()), $options: "i" };
  return useInfiniteQuery({
    queryKey: ["articles", query],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      base44.entities.Article.filter(query, { sort: view === "today" ? "-relevance" : "-published_at", limit: 24, cursor: pageParam }),
    getNextPageParam: (p) => (p.has_more ? p.next_cursor : undefined),
  });
}

export function useCounts() {
  return useQuery({
    queryKey: ["counts"],
    queryFn: async () => {
      const [today, saved, all] = await Promise.all([
        base44.entities.Article.count({ fetched_date: todayStr() }),
        base44.entities.Article.count({ bookmarked: true }),
        base44.entities.Article.count({}),
      ]);
      return { today, saved, all };
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () =>
      (await base44.entities.Article.filter({ fetched_date: todayStr(), is_alert: true }, { sort: "-published_at", limit: 3 })).items,
  });
}

export function useBriefing() {
  return useQuery({
    queryKey: ["briefing", todayStr()],
    queryFn: async () => (await base44.entities.Briefing.filter({ date: todayStr() }, { limit: 1 })).items[0] || null,
  });
}

export function useInvalidateNews() {
  const qc = useQueryClient();
  return () => {
    ["articles", "counts", "alerts", "briefing"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
}