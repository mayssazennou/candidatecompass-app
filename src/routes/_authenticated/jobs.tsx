import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CONTRACT_LABELS, ContractType, JOB_STATUS_LABELS, JobStatus } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/jobs")({
  component: JobsPage,
});

function JobsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, applications(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell
      title="Offres d'emploi"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="size-4" /> Nouvelle offre</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Créer une offre</DialogTitle></DialogHeader>
            <JobForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["jobs"] }); }} />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Intitulé</th>
              <th className="text-left px-4 py-2.5 font-medium">Département</th>
              <th className="text-left px-4 py-2.5 font-medium">Lieu</th>
              <th className="text-left px-4 py-2.5 font-medium">Contrat</th>
              <th className="text-left px-4 py-2.5 font-medium">Statut</th>
              <th className="text-right px-4 py-2.5 font-medium">Candidatures</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Chargement…</td></tr>}
            {!isLoading && !data?.length && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucune offre. Créez-en une.</td></tr>}
            {data?.map((j: any) => (
              <tr key={j.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link to="/jobs/$id" params={{ id: j.id }} className="font-medium hover:text-primary">{j.title}</Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{j.department || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{j.location || "—"}</td>
                <td className="px-4 py-3">{CONTRACT_LABELS[j.contract_type as ContractType]}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={j.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{j.applications?.[0]?.count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const colors: Record<JobStatus, string> = {
    open: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    draft: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    on_hold: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    closed: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${colors[status]}`}>{JOB_STATUS_LABELS[status]}</span>;
}

function JobForm({ onDone }: { onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("jobs").insert({
      title: String(fd.get("title")),
      department: String(fd.get("department") || "") || null,
      location: String(fd.get("location") || "") || null,
      contract_type: fd.get("contract_type") as ContractType,
      status: fd.get("status") as JobStatus,
      description: String(fd.get("description") || "") || null,
      requirements: String(fd.get("requirements") || "") || null,
      salary_min: fd.get("salary_min") ? Number(fd.get("salary_min")) : null,
      salary_max: fd.get("salary_max") ? Number(fd.get("salary_max")) : null,
      created_by: u.user!.id,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Offre créée"); onDone(); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>Intitulé *</Label><Input name="title" required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Département</Label><Input name="department" /></div>
        <div><Label>Lieu</Label><Input name="location" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Contrat</Label>
          <Select name="contract_type" defaultValue="cdi">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTRACT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Statut</Label>
          <Select name="status" defaultValue="open">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(JOB_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Salaire min (€)</Label><Input name="salary_min" type="number" /></div>
        <div><Label>Salaire max (€)</Label><Input name="salary_max" type="number" /></div>
      </div>
      <div><Label>Description</Label><Textarea name="description" rows={3} /></div>
      <div><Label>Pré-requis</Label><Textarea name="requirements" rows={3} /></div>
      <Button type="submit" disabled={saving} className="w-full">{saving ? "Création…" : "Créer l'offre"}</Button>
    </form>
  );
}
