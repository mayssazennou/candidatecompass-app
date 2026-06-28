import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { INTERVIEW_TYPE_LABELS, INTERVIEW_STATUS_LABELS, RATING_LABELS, InterviewType, InterviewStatus, FeedbackRating } from "@/lib/db-types";

const searchSchema = z.object({ application: z.string().optional() });

export const Route = createFileRoute("/_authenticated/interviews")({
  validateSearch: searchSchema,
  component: InterviewsPage,
});

function InterviewsPage() {
  const { application } = Route.useSearch();
  const qc = useQueryClient();
  const [open, setOpen] = useState(!!application);
  const [editing, setEditing] = useState<any | null>(null);

  const { data } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*, applications(id, candidates(first_name,last_name), jobs(title))")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell
      title="Entretiens"
      actions={
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm" onClick={() => setEditing(null)}><Plus className="size-4" /> Planifier</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Modifier l'entretien" : "Planifier un entretien"}</DialogTitle></DialogHeader>
            <InterviewForm
              defaultApplicationId={application}
              existing={editing}
              onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["interviews"] }); }}
            />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Date</th>
              <th className="text-left px-4 py-2.5 font-medium">Candidat</th>
              <th className="text-left px-4 py-2.5 font-medium">Offre</th>
              <th className="text-left px-4 py-2.5 font-medium">Type</th>
              <th className="text-left px-4 py-2.5 font-medium">Statut</th>
              <th className="text-left px-4 py-2.5 font-medium">Feedback</th>
              <th className="text-right px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!data?.length && <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Aucun entretien planifié.</td></tr>}
            {data?.map((i: any) => (
              <tr key={i.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 tabular-nums">
                  <div className="flex items-center gap-2"><Calendar className="size-3 text-muted-foreground" />{new Date(i.scheduled_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
                </td>
                <td className="px-4 py-3">{i.applications?.candidates?.first_name} {i.applications?.candidates?.last_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{i.applications?.jobs?.title}</td>
                <td className="px-4 py-3">{INTERVIEW_TYPE_LABELS[i.type as InterviewType]}</td>
                <td className="px-4 py-3"><StatusPill status={i.status} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{i.rating ? RATING_LABELS[i.rating as FeedbackRating] : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(i); setOpen(true); }}>Modifier</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: InterviewStatus }) {
  const colors: Record<InterviewStatus, string> = {
    scheduled: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    no_show: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${colors[status]}`}>{INTERVIEW_STATUS_LABELS[status]}</span>;
}

function InterviewForm({ defaultApplicationId, existing, onDone }: { defaultApplicationId?: string; existing?: any; onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const [appId, setAppId] = useState(existing?.application_id ?? defaultApplicationId ?? "");
  const [type, setType] = useState<InterviewType>(existing?.type ?? "phone");
  const [status, setStatus] = useState<InterviewStatus>(existing?.status ?? "scheduled");
  const [rating, setRating] = useState<FeedbackRating | "">(existing?.rating ?? "");

  const { data: apps } = useQuery({
    queryKey: ["apps-min"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("id, candidates(first_name,last_name), jobs(title)");
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!appId) { toast.error("Sélectionnez une candidature"); return; }
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { data: u } = await supabase.auth.getUser();
    const payload: any = {
      application_id: appId,
      type, status,
      scheduled_at: new Date(String(fd.get("scheduled_at"))).toISOString(),
      duration_minutes: Number(fd.get("duration_minutes") || 60),
      location: String(fd.get("location") || "") || null,
      meeting_url: String(fd.get("meeting_url") || "") || null,
      interviewer_name: String(fd.get("interviewer_name") || "") || null,
      feedback: String(fd.get("feedback") || "") || null,
      rating: rating || null,
    };
    let res;
    if (existing) res = await supabase.from("interviews").update(payload).eq("id", existing.id);
    else res = await supabase.from("interviews").insert({ ...payload, created_by: u.user!.id });
    setSaving(false);
    if (res.error) toast.error(res.error.message);
    else { toast.success(existing ? "Entretien mis à jour" : "Entretien planifié"); onDone(); }
  }

  const dt = existing?.scheduled_at ? new Date(existing.scheduled_at).toISOString().slice(0, 16) : "";

  return (
    <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label>Candidature *</Label>
        <Select value={appId} onValueChange={setAppId}>
          <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
          <SelectContent>
            {(apps ?? []).map((a: any) => (
              <SelectItem key={a.id} value={a.id}>{a.candidates?.first_name} {a.candidates?.last_name} — {a.jobs?.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Date & heure *</Label><Input name="scheduled_at" type="datetime-local" required defaultValue={dt} /></div>
        <div><Label>Durée (min)</Label><Input name="duration_minutes" type="number" defaultValue={existing?.duration_minutes ?? 60} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(INTERVIEW_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Statut</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as InterviewStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(INTERVIEW_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Recruteur / Interviewer</Label><Input name="interviewer_name" defaultValue={existing?.interviewer_name ?? ""} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Lieu</Label><Input name="location" defaultValue={existing?.location ?? ""} /></div>
        <div><Label>Lien visio</Label><Input name="meeting_url" type="url" defaultValue={existing?.meeting_url ?? ""} /></div>
      </div>
      <div>
        <Label>Évaluation</Label>
        <Select value={rating} onValueChange={(v) => setRating(v as FeedbackRating)}>
          <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>{Object.entries(RATING_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Feedback / Compte-rendu</Label><Textarea name="feedback" rows={4} defaultValue={existing?.feedback ?? ""} /></div>
      <Button type="submit" disabled={saving} className="w-full">{saving ? "Enregistrement…" : existing ? "Enregistrer" : "Planifier"}</Button>
    </form>
  );
}
