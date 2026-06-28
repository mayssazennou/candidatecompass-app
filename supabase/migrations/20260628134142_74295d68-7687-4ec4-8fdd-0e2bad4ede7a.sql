
-- Rôles
CREATE TYPE public.app_role AS ENUM ('admin', 'recruiter');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger pour créer profile + premier admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recruiter');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helpers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Enums métier
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'on_hold', 'closed');
CREATE TYPE public.contract_type AS ENUM ('cdi', 'cdd', 'stage', 'alternance', 'freelance', 'interim');
CREATE TYPE public.application_stage AS ENUM ('new', 'screening', 'interview', 'offer', 'hired', 'rejected');
CREATE TYPE public.interview_type AS ENUM ('phone', 'video', 'onsite', 'technical', 'hr', 'final');
CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.feedback_rating AS ENUM ('strong_no', 'no', 'maybe', 'yes', 'strong_yes');

-- Offres
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  contract_type public.contract_type NOT NULL DEFAULT 'cdi',
  description TEXT,
  requirements TEXT,
  salary_min INT,
  salary_max INT,
  status public.job_status NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated update jobs" ON public.jobs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = created_by);
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Candidats (CVthèque)
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  current_position TEXT,
  current_company TEXT,
  location TEXT,
  linkedin_url TEXT,
  years_experience INT,
  skills TEXT[],
  notes TEXT,
  cv_url TEXT,
  cv_path TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read candidates" ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert candidates" ON public.candidates FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated update candidates" ON public.candidates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins delete candidates" ON public.candidates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = created_by);
CREATE TRIGGER trg_candidates_updated BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Candidatures (affectation candidat <-> offre)
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  stage public.application_stage NOT NULL DEFAULT 'new',
  notes TEXT,
  rejection_reason TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read applications" ON public.applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated update applications" ON public.applications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete applications" ON public.applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = created_by);
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Entretiens
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  type public.interview_type NOT NULL DEFAULT 'phone',
  status public.interview_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  location TEXT,
  meeting_url TEXT,
  interviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interviewer_name TEXT,
  feedback TEXT,
  rating public.feedback_rating,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read interviews" ON public.interviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert interviews" ON public.interviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated update interviews" ON public.interviews FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete interviews" ON public.interviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = created_by);
CREATE TRIGGER trg_interviews_updated BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
CREATE INDEX idx_interviews_application ON public.interviews(application_id);
CREATE INDEX idx_interviews_scheduled ON public.interviews(scheduled_at);
