import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGES, ApplicationStage } from "@/lib/db-types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: Pipeline,
});

function Pipeline() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*, candidates(*), jobs(title)").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function move(id: string, stage: ApplicationStage) {
    const { error } = await supabase.from("applications").update({ stage }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Étape mise à jour"); qc.invalidateQueries({ queryKey: ["pipeline"] }); }
  }

  return (
    <AppShell title="Pipeline global">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((s) => {
          const items = (data ?? []).filter((a: any) => a.stage === s.value);
          return (
            <div key={s.value} className="rounded-lg border border-border bg-card/50 min-h-48">
              <header className={`px-3 py-2 border-b border-border flex items-center justify-between text-xs uppercase tracking-wider rounded-t-lg ${s.color}`}>
                <span>{s.label}</span>
                <span className="tabular-nums">{items.length}</span>
              </header>
              <ul className="p-2 space-y-1.5">
                {items.map((a: any) => (
                  <li key={a.id} className="p-2 rounded bg-card border border-border text-xs">
                    <div className="font-medium">{a.candidates.first_name} {a.candidates.last_name}</div>
                    <Link to="/jobs/$id" params={{ id: a.job_id }} className="block text-[11px] text-muted-foreground hover:text-primary truncate">{a.jobs.title}</Link>
                    <Select value={a.stage} onValueChange={(v) => move(a.id, v as ApplicationStage)}>
                      <SelectTrigger className="h-7 mt-1.5 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s2) => <SelectItem key={s2.value} value={s2.value}>{s2.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
