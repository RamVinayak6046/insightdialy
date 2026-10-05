import { GraduationCap, Briefcase, Cpu, TrendingUp, Landmark, Trophy, CloudSun, AlertTriangle } from "lucide-react";

export const CATEGORIES = [
  { key: "alerts", label: "Alerts", icon: AlertTriangle, tint: "bg-red-500/10 text-red-600 dark:text-red-400" },
  { key: "education", label: "Education", icon: GraduationCap, tint: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  { key: "jobs", label: "Jobs & Skills", icon: Briefcase, tint: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  { key: "tech", label: "Tech & AI", icon: Cpu, tint: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  { key: "business", label: "Business", icon: TrendingUp, tint: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  { key: "government", label: "Government", icon: Landmark, tint: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  { key: "sports", label: "Sports", icon: Trophy, tint: "bg-lime-500/10 text-lime-700 dark:text-lime-400" },
  { key: "weather", label: "Weather", icon: CloudSun, tint: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const todayStr = () => new Date().toISOString().slice(0, 10);

export function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}