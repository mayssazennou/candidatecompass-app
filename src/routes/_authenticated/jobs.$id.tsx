import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { STAGES, ApplicationStage, CONTRACT_LABELS, JOB_STATUS_LABELS, JobStatus, ContractType } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/jobs/$id")({
  component: JobDetail,
});

function JobDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: job } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: apps } = useQuery({
    queryKey: ["job-applications", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, candidates(*)")
        .eq("job_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function moveStage(appId: string, stage: ApplicationStage) {
    const { error } = await supabase.from("applications").update({ stage }).eq("id", appId);
    if (error) toast.error(error.message);
    else { toast.success("Étape mise à jour"); qc.invalidateQueries({ queryKey: ["job-applications", id] }); }
  }

  return (
    <AppShell
      title={job?.title ?? "Offre"}
      actions={
        <>
          <Link to="/jobs"><Button variant="ghost" size="sm"><ArrowLeft className="size-4" /> Retour</Button></Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="size-4" /> Affecter un candidat</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Affecter un candidat</DialogTitle></DialogHeader>
              <AssignForm jobId={id} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["job-applications", id] }); }} />
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {job && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-border bg-muted">{CONTRACT_LABELS[job.contract_type as ContractType]}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-border bg-muted">{JOB_STATUS_LABELS[job.status as JobStatus]}</span>
              {job.location && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-border bg-muted">{job.location}</span>}
              {job.department && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-border bg-muted">{job.department}</span>}
            </div>
            {job.description && <><h3 className="text-sm font-semibold mb-1 mt-3">Description</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p></>}
            {job.requirements && <><h3 className="text-sm font-semibold mb-1 mt-4">Pré-requis</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.requirements}</p></>}
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Salaire</h3>
            <div className="text-2xl font-bold tabular-nums">
              {job.salary_min ? `${job.salary_min.toLocaleString("fr-FR")}€` : "—"}
              {job.salary_max && job.salary_max !== job.salary_min ? ` – ${job.salary_max.toLocaleString("fr-FR")}€` : ""}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Brut annuel</div>
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold mb-2">Activité</h3>
              <div className="text-xs text-muted-foreground">Créée le {new Date(job.created_at).toLocaleDateString("fr-FR")}</div>
              <div className="text-xs text-muted-foreground">{apps?.length ?? 0} candidature(s)</div>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((s) => {
            const items = (apps ?? []).filter((a: any) => a.stage === s.value);
            return (
              <div key={s.value} className="rounded-lg border border-border bg-card/50 min-h-40">
                <header className={`px-3 py-2 border-b border-border flex items-center justify-between text-xs uppercase tracking-wider rounded-t-lg ${s.color}`}>
                  <span>{s.label}</span>
                  <span className="tabular-nums">{items.length}</span>
                </header>
                <ul className="p-2 space-y-1.5">
                  {items.map((a: any) => (
                    <li key={a.id} className="p-2 rounded bg-card border border-border text-xs">
                      <div className="font-medium">{a.candidates.first_name} {a.candidates.last_name}</div>
                      <div className="text-muted-foreground text-[11px]">{a.candidates.current_position || "—"}</div>
                      <Select value={a.stage} onValueChange={(v) => moveStage(a.id, v as ApplicationStage)}>
                        <SelectTrigger className="h-7 mt-1.5 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s2) => <SelectItem key={s2.value} value={s2.value}>{s2.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Link to="/interviews" search={{ application: a.id }} className="block mt-1 text-[10px] text-primary hover:underline">Planifier entretien →</Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function AssignForm({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [candidateId, setCandidateId] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: candidates } = useQuery({
    queryKey: ["candidates-min"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("id,first_name,last_name").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidateId) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("applications").insert({ job_id: jobId, candidate_id: candidateId, created_by: u.user!.id });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Candidat affecté"); onDone(); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-sm">Candidat</label>
        <Select value={candidateId} onValueChange={setCandidateId}>
          <SelectTrigger><SelectValue placeholder="Choisir un candidat…" /></SelectTrigger>
          <SelectContent>
            {(candidates ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={!candidateId || saving} className="w-full">{saving ? "Affectation…" : "Affecter"}</Button>
    </form>
  );
}
