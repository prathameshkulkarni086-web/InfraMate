-- 0002_multitenant_workspaces.sql
-- InfraSync Complete Multi-Tenant Workspace & Project Isolation Schema

-- 1. Create Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);

-- Enable RLS on workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 2. Create Workspace Members Table (for multi-user collaboration & IAM)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  permissions jsonb DEFAULT '[]'::jsonb,
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT unique_workspace_user UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace RLS Policies
CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their workspaces"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- Workspace Members RLS Policies
CREATE POLICY "Users can view members of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners/admins can manage members"
  ON public.workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- 3. Update Projects Table for Multi-Tenant Isolation
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS project_type text DEFAULT 'Commercial',
  ADD COLUMN IF NOT EXISTS site_address text,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS progress_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spent_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plot_area_sq_ft numeric,
  ADD COLUMN IF NOT EXISTS floors integer;

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);

-- Drop old project policies if they exist and enforce workspace-scoped RLS
DROP POLICY IF EXISTS "Users can view their own projects." ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects." ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects." ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects." ON public.projects;

CREATE POLICY "Users can view projects in their workspace"
  ON public.projects FOR SELECT
  USING (
    workspace_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert projects in their workspace"
  ON public.projects FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their workspace"
  ON public.projects FOR UPDATE
  USING (
    workspace_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects in their workspace"
  ON public.projects FOR DELETE
  USING (
    workspace_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- 4. Create Resource Tables (Workers, Attendance, Expenses, Materials, Progress, Tasks, Equipment)

-- Workers Table
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  phone text,
  daily_wage numeric DEFAULT 0,
  overtime_rate numeric DEFAULT 0,
  joining_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace isolation for workers" ON public.workers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workers.workspace_id AND workspace_members.user_id = auth.uid()));

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'Cash',
  invoice_number text,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace isolation for expenses" ON public.expenses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = expenses.workspace_id AND workspace_members.user_id = auth.uid()));

-- Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'units',
  minimum_stock numeric DEFAULT 10,
  purchase_price numeric DEFAULT 0,
  supplier_name text,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace isolation for materials" ON public.materials FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = materials.workspace_id AND workspace_members.user_id = auth.uid()));

-- Progress Logs & DPR Table
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  description text NOT NULL,
  percentage numeric DEFAULT 0,
  completed_tasks jsonb DEFAULT '[]'::jsonb,
  issues jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  weather text,
  added_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace isolation for progress logs" ON public.progress_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = progress_logs.workspace_id AND workspace_members.user_id = auth.uid()));

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to text,
  priority text DEFAULT 'medium',
  status text DEFAULT 'todo',
  start_date date,
  due_date date,
  completion_percentage numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace isolation for tasks" ON public.tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = tasks.workspace_id AND workspace_members.user_id = auth.uid()));

-- Trigger to auto-create workspace and membership on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
  new_ws_id uuid;
  ws_name text;
BEGIN
  ws_name := COALESCE(new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'full_name', 'My Organization') || ' Workspace';
  
  -- Create isolated workspace for new user
  INSERT INTO public.workspaces (name, company_name, owner_id)
  VALUES (ws_name, new.raw_user_meta_data->>'company_name', new.id)
  RETURNING id INTO new_ws_id;

  -- Add user as workspace admin member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_ws_id, new.id, 'admin');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and attach
DROP TRIGGER IF EXISTS on_auth_user_created_workspace ON auth.users;
CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_workspace();
