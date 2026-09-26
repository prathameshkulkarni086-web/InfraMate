-- 0003_device_biometric_attendance.sql
-- InfraSync Secure Phone / Device Native Biometric Attendance & Geofence Schema

-- 1. Create Attendance Table with Biometric & Geofence Fields
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  worker_id text NOT NULL,
  worker_name text,
  worker_role text,
  project_id text NOT NULL,
  project_name text,
  site_id text NOT NULL DEFAULT 'main',
  site_name text,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time text,
  check_out_time text,
  check_in_timestamp timestamptz DEFAULT now(),
  check_out_timestamp timestamptz,
  attendance_method text NOT NULL DEFAULT 'DEVICE_BIOMETRIC', -- 'DEVICE_BIOMETRIC', 'GPS_100M', 'MANUAL', 'ADMIN_OVERRIDE'
  latitude double precision,
  longitude double precision,
  distance_from_site double precision,
  device_id text,
  biometric_verified boolean DEFAULT false,
  status text NOT NULL DEFAULT 'present', -- 'present', 'absent', 'half_day', 'overtime', 'on_leave'
  daily_wage numeric(10, 2) DEFAULT 0,
  calculated_wage numeric(10, 2) DEFAULT 0,
  working_hours numeric(4, 2) DEFAULT 8.0,
  overtime_hours numeric(4, 2) DEFAULT 0.0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_worker_daily_attendance UNIQUE (worker_id, project_id, attendance_date)
);

-- Indexing for high-performance muster queries & anti-fraud lookups
CREATE INDEX IF NOT EXISTS idx_attendance_worker_date ON public.attendance(worker_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_project_date ON public.attendance(project_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_workspace ON public.attendance(workspace_id);
CREATE INDEX IF NOT EXISTS idx_attendance_method ON public.attendance(attendance_method);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Attendance RLS Policies
CREATE POLICY "Users can view attendance in their workspace"
  ON public.attendance FOR SELECT
  USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = attendance.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can mark attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = attendance.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace managers/admins can update attendance"
  ON public.attendance FOR UPDATE
  USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = attendance.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('admin', 'project_manager', 'site_engineer', 'supervisor')
    )
  );

-- 2. Anti-Fraud & Biometric Audit Log Table
CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  attendance_id uuid REFERENCES public.attendance(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'BIOMETRIC_AUTH_SUCCESS', 'OUT_OF_BOUNDS_ATTEMPT', 'MOCK_LOCATION_DETECTED', 'MANUAL_OVERRIDE'
  worker_id text NOT NULL,
  worker_name text,
  project_id text NOT NULL,
  site_id text,
  distance_meters double precision,
  allowed_radius_meters double precision DEFAULT 100,
  latitude double precision,
  longitude double precision,
  device_id text,
  client_ip text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_worker ON public.attendance_audit_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_project ON public.attendance_audit_logs(project_id);

ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs in their workspace"
  ON public.attendance_audit_logs FOR SELECT
  USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = attendance_audit_logs.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );
