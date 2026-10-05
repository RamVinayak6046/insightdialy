import React from "react";
import { Bookmark, ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/ui/image";
import { CATEGORY_MAP, timeAgo } from "@/lib/news";

export default function ArticleCard({ article, onToggleBookmark }) {
  const cat = CATEGORY_MAP[article.category];
  const Icon = cat?.icon;
  return (
    <article className="group flex flex-col rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      {article.image_url && (
        <Image src={article.image_url} alt="" className="-mx-5 -mt-5 mb-4 h-40 w-[calc(100%+2.5rem)] rounded-t-2xl object-cover" />
      )}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {cat && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cat.tint}`}>
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {cat.label}
            </span>
          )}
          <Badge variant="outline" className="text-[11px] font-normal capitalize">{article.region}</Badge>
          {article.is_alert && <Badge variant="destructive" className="text-[11px]">Alert</Badge>}
          {!article.is_alert && ["high", "critical"].includes(article.importance) && (
            <Badge className="text-[11px] capitalize">{article.importance}</Badge>
          )}
        </div>
        <button
          onClick={() => onToggleBookmark(article)}
          aria-label={article.bookmarked ? "Remove bookmark" : "Save article"}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bookmark className={`h-4 w-4 ${article.bookmarked ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>
      <h3 className="mb-2 text-lg font-semibold leading-snug">{article.title}</h3>
      {article.summary && <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {article.source || "Source"} · {timeAgo(article.published_at || article.created_date)}
        </span>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Read <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}