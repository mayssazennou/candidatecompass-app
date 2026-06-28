import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Briefcase, Users, CalendarDays, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { STAGES } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [jobs, candidates, applications, interviews] = await Promise.all([
        supabase.from("jobs").select("id,status", { count: "exact" }),
        supabase.from("candidates").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id,stage,created_at,candidate_id,job_id,candidates(first_name,last_name),jobs(title)").order("created_at", { ascending: false }).limit(8),
        supabase.from("interviews").select("id,scheduled_at,type,status,application_id,applications(candidates(first_name,last_name),jobs(title))").gte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(5),
      ]);
      return {
        jobsTotal: jobs.count ?? 0,
        jobsOpen: (jobs.data ?? []).filter((j) => j.status === "open").length,
        candidatesTotal: candidates.count ?? 0,
        recentApps: applications.data ?? [],
        upcomingInterviews: interviews.data ?? [],
      };
    },
  });

  const stats = [
    { label: "Offres ouvertes", value: data?.jobsOpen ?? 0, sub: `${data?.jobsTotal ?? 0} au total`, icon: Briefcase },
    { label: "Candidats", value: data?.candidatesTotal ?? 0, sub: "dans la CVthèque", icon: Users },
    { label: "Candidatures récentes", value: data?.recentApps.length ?? 0, sub: "les 8 dernières", icon: TrendingUp },
    { label: "Entretiens à venir", value: data?.upcomingInterviews.length ?? 0, sub: "prochains 7 jours", icon: CalendarDays },
  ];

  return (
    <AppShell title="Tableau de bord">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className="size-4 text-primary" />
            </div>
            <div className="text-3xl font-bold tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-lg border border-border bg-card">
          <header className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Candidatures récentes</h2>
            <Link to="/pipeline" className="text-xs text-primary hover:underline">Voir le pipeline →</Link>
          </header>
          <ul className="divide-y divide-border">
            {(data?.recentApps ?? []).map((a: any) => {
              const stage = STAGES.find((s) => s.value === a.stage)!;
              return (
                <li key={a.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{a.candidates?.first_name} {a.candidates?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{a.jobs?.title}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${stage.color}`}>{stage.label}</span>
                </li>
              );
            })}
            {!data?.recentApps.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune candidature.</li>}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <header className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Prochains entretiens</h2>
            <Link to="/interviews" className="text-xs text-primary hover:underline">Planning →</Link>
          </header>
          <ul className="divide-y divide-border">
            {(data?.upcomingInterviews ?? []).map((i: any) => (
              <li key={i.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{i.applications?.candidates?.first_name} {i.applications?.candidates?.last_name}</div>
                  <div className="text-xs text-muted-foreground">{i.applications?.jobs?.title}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="tabular-nums">{new Date(i.scheduled_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
                  <div className="text-muted-foreground">{i.type}</div>
                </div>
              </li>
            ))}
            {!data?.upcomingInterviews.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun entretien planifié.</li>}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
