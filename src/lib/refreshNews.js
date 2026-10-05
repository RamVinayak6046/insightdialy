import { refreshNewsFeeds } from "@/functions/refreshNewsFeeds";

// Pulls live RSS feeds on the server, summarizes/ranks them with AI and stores new stories.
export async function refreshNews(onProgress) {
  onProgress("Fetching feeds…");
  try {
    const res = await refreshNewsFeeds({});
    return { added: res.data.added || 0 };
  } finally {
    onProgress("");
  }
}