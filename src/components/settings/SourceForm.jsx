import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/news";

const BLANK = { name: "", type: "ai_search", endpoint_url: "", secret_name: "", preferred_domains: "", categories: [], frequency: "manual", enabled: true, notes: "" };

export default function SourceForm({ open, onOpenChange, initial, onSave, saving }) {
  const [f, setF] = useState(BLANK);
  useEffect(() => { if (open) setF({ ...BLANK, ...(initial || {}) }); }, [open, initial]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleCat = (k) => set("categories", f.categories.includes(k) ? f.categories.filter((c) => c !== k) : [...f.categories, k]);
  const external = f.type !== "ai_search";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{initial?.id ? "Edit news source" : "Add news source"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Education watch" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={f.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_search">AI web search</SelectItem>
                  <SelectItem value="rss">RSS feed</SelectItem>
                  <SelectItem value="rest_api">News API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Update frequency</Label>
              <Select value={f.frequency} onValueChange={(v) => set("frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {external ? (
            <>
              <div className="space-y-1.5">
                <Label>Endpoint URL</Label>
                <Input value={f.endpoint_url} onChange={(e) => set("endpoint_url", e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-1.5">
                <Label>API key secret name</Label>
                <Input value={f.secret_name} onChange={(e) => set("secret_name", e.target.value)} placeholder="NEWS_API_KEY" />
                <p className="text-xs text-muted-foreground">Store only the secret's name here. Add the key itself in your app's secrets.</p>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label>Preferred publishers</Label>
              <Input value={f.preferred_domains} onChange={(e) => set("preferred_domains", e.target.value)} placeholder="thehindu.com, indianexpress.com" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Categories <span className="font-normal text-muted-foreground">(none selected = all)</span></Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => toggleCat(c.key)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${f.categories.includes(c.key) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!f.name.trim() || saving} onClick={() => onSave(f)}>Save source</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}