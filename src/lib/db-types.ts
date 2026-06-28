export type JobStatus = "draft" | "open" | "on_hold" | "closed";
export type ContractType = "cdi" | "cdd" | "stage" | "alternance" | "freelance" | "interim";
export type ApplicationStage = "new" | "screening" | "interview" | "offer" | "hired" | "rejected";
export type InterviewType = "phone" | "video" | "onsite" | "technical" | "hr" | "final";
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type FeedbackRating = "strong_no" | "no" | "maybe" | "yes" | "strong_yes";

export const STAGES: { value: ApplicationStage; label: string; color: string }[] = [
  { value: "new", label: "Nouveau", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" },
  { value: "screening", label: "Pré-qualif", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  { value: "interview", label: "Entretien", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  { value: "offer", label: "Offre", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
  { value: "hired", label: "Embauché", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { value: "rejected", label: "Refusé", color: "bg-red-500/20 text-red-300 border-red-500/40" },
];

export const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  alternance: "Alternance",
  freelance: "Freelance",
  interim: "Intérim",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Brouillon",
  open: "Ouverte",
  on_hold: "En pause",
  closed: "Fermée",
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: "Téléphonique",
  video: "Visio",
  onsite: "Sur site",
  technical: "Technique",
  hr: "RH",
  final: "Final",
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
};

export const RATING_LABELS: Record<FeedbackRating, string> = {
  strong_no: "Très défavorable",
  no: "Défavorable",
  maybe: "Mitigé",
  yes: "Favorable",
  strong_yes: "Très favorable",
};
