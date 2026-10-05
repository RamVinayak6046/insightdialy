import React from "react";

const FIELDS = [
  ["title", "Headline"],
  ["summary", "Short summary"],
  ["category", "One of 8 topics"],
  ["source", "Publisher name"],
  ["url", "Source URL"],
  ["published_at", "Published time"],
  ["image_url", "Image URL"],
  ["importance", "low · medium · high · critical"],
  ["fetched_at", "When it was fetched"],
];

export default function DataModelCard() {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="text-lg font-semibold">News article data model</h2>
      <p className="mb-3 text-sm text-muted-foreground">Any live feed or API should map its stories to these fields before saving.</p>
      <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {FIELDS.map(([k, d]) => (
          <div key={k} className="flex justify-between gap-3 border-b py-1.5">
            <dt className="font-mono text-xs">{k}</dt>
            <dd className="text-right text-muted-foreground">{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}