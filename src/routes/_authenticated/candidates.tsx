import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidates")({
  component: CandidatesPage,
});

function CandidatesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["candidates", q],
    queryFn: async () => {
      let query = supabase.from("candidates").select("*").order("created_at", { ascending: false });
      if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,current_position.ilike.%${q}%,current_company.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell
      title="CVthèque"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="size-4" /> Ajouter un candidat</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nouveau candidat</DialogTitle></DialogHeader>
            <CandidateForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["candidates"] }); }} />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-4 relative max-w-sm">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (nom, poste, entreprise…)" className="pl-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {data?.map((c: any) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{c.first_name} {c.last_name}</h3>
                <p className="text-xs text-muted-foreground">{c.current_position}{c.current_company ? ` · ${c.current_company}` : ""}</p>
              </div>
              {c.years_experience != null && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-border bg-muted tabular-nums">{c.years_experience} ans</span>}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {c.email && <div>{c.email}</div>}
              {c.phone && <div>{c.phone}</div>}
              {c.location && <div>{c.location}</div>}
            </div>
            {c.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {c.skills.slice(0, 6).map((s: string) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{s}</span>)}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 text-xs">
              {c.cv_url && <a href={c.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><FileText className="size-3" /> CV</a>}
              {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="size-3" /> LinkedIn</a>}
            </div>
          </div>
        ))}
        {data && !data.length && <div className="col-span-full text-center py-12 text-sm text-muted-foreground">Aucun candidat.</div>}
      </div>
    </AppShell>
  );
}

function CandidateForm({ onDone }: { onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { data: u } = await supabase.auth.getUser();
    let cv_url: string | null = null;
    let cv_path: string | null = null;
    if (cvFile) {
      const path = `${u.user!.id}/${Date.now()}-${cvFile.name}`;
      const up = await supabase.storage.from("cvs").upload(path, cvFile);
      if (up.error) { toast.error("Upload CV : " + up.error.message); setSaving(false); return; }
      cv_path = path;
      const { data: signed } = await supabase.storage.from("cvs").createSignedUrl(path, 60 * 60 * 24 * 365);
      cv_url = signed?.signedUrl ?? null;
    }
    const skills = String(fd.get("skills") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("candidates").insert({
      first_name: String(fd.get("first_name")),
      last_name: String(fd.get("last_name")),
      email: String(fd.get("email") || "") || null,
      phone: String(fd.get("phone") || "") || null,
      current_position: String(fd.get("current_position") || "") || null,
      current_company: String(fd.get("current_company") || "") || null,
      location: String(fd.get("location") || "") || null,
      linkedin_url: String(fd.get("linkedin_url") || "") || null,
      years_experience: fd.get("years_experience") ? Number(fd.get("years_experience")) : null,
      skills: skills.length ? skills : null,
      notes: String(fd.get("notes") || "") || null,
      cv_url, cv_path,
      created_by: u.user!.id,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Candidat ajouté"); onDone(); }
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Prénom *</Label><Input name="first_name" required /></div>
        <div><Label>Nom *</Label><Input name="last_name" required /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Email</Label><Input name="email" type="email" /></div>
        <div><Label>Téléphone</Label><Input name="phone" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Poste actuel</Label><Input name="current_position" /></div>
        <div><Label>Entreprise</Label><Input name="current_company" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Localisation</Label><Input name="location" /></div>
        <div><Label>Années d'expérience</Label><Input name="years_experience" type="number" /></div>
      </div>
      <div><Label>LinkedIn</Label><Input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." /></div>
      <div><Label>Compétences (séparées par des virgules)</Label><Input name="skills" placeholder="React, TypeScript, Node…" /></div>
      <div><Label>CV (PDF)</Label><Input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} /></div>
      <div><Label>Notes</Label><Textarea name="notes" rows={3} /></div>
      <Button type="submit" disabled={saving} className="w-full">{saving ? "Enregistrement…" : "Ajouter"}</Button>
    </form>
  );
}
