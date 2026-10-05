import React from "react";
import { AlertTriangle } from "lucide-react";

export default function AlertsStrip({ alerts }) {
  if (!alerts.length) return null;
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
        <AlertTriangle className="h-4 w-4" /> Important alerts
      </div>
      <ul className="space-y-1.5">
        {alerts.map((a) => (
          <li key={a.id} className="text-sm">
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{a.title}</a>
            <span className="text-muted-foreground"> — {a.source}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}