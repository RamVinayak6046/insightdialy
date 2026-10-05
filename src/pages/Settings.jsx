import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import SubHeader from "@/components/news/SubHeader";
import SourceCard from "@/components/settings/SourceCard";
import SourceForm from "@/components/settings/SourceForm";
import DataModelCard from "@/components/settings/DataModelCard";

export default function Settings() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const sources = useQuery({
    queryKey: ["sources"],
    queryFn: async () => (await base44.entities.NewsSource.filter({}, { sort: "-created_date", limit: 100 })).items,
  });
  const reload = () => qc.invalidateQueries({ queryKey: ["sources"] });

  const save = async (f) => {
    setSaving(true);
    const { id, created_date, updated_date, created_by_id, ...data } = f;
    if (id) await base44.entities.NewsSource.update(id, data);
    else await base44.entities.NewsSource.create(data);
    setSaving(false);
    setOpen(false);
    reload();
  };
  const toggle = async (s, enabled) => { await base44.entities.NewsSource.update(s.id, { enabled }); reload(); };
  const remove = async (s) => { await base44.entities.NewsSource.delete(s.id); reload(); };
  const openForm = (s) => { setEditing(s); setOpen(true); };

  return (
    <div className="min-h-screen">
      <SubHeader
        title="News sources"
        subtitle="Control where the dashboard gets its stories"
        action={<Button size="sm" className="rounded-full" onClick={() => openForm(null)}><Plus className="mr-1.5 h-4 w-4" />Add source</Button>}
      />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          Refresh uses every enabled <strong>AI web search</strong> source and its categories. With no sources set up, all categories are fetched. RSS and API sources are saved and ready for a connector function.
        </p>
        {sources.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : sources.data?.length ? (
          <div className="space-y-3">
            {sources.data.map((s) => <SourceCard key={s.id} source={s} onToggle={toggle} onEdit={openForm} onDelete={remove} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            No sources yet — all topics are fetched by default. Add one to customize.
          </div>
        )}
        <DataModelCard />
      </main>
      <SourceForm open={open} onOpenChange={setOpen} initial={editing} onSave={save} saving={saving} />
    </div>
  );
}