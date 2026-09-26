-- ==============================================================================
-- 0004: Quality Inspection Module Schema (Camera-Only Physical Evidence & Anti-Fraud)
-- ==============================================================================

-- 1. Quality Inspections Table
CREATE TABLE IF NOT EXISTS public.quality_inspections (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  inspector_id TEXT NOT NULL,
  inspector_name TEXT NOT NULL,
  inspector_role TEXT NOT NULL,
  assigned_engineer_id TEXT,
  assigned_engineer_name TEXT,
  observations TEXT,
  action_required TEXT,
  review_remarks TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  defect_id TEXT,
  dpr_id TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inspection Photos Table (Immutable Camera Capture Evidence)
CREATE TABLE IF NOT EXISTS public.inspection_photos (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  captured_by TEXT NOT NULL,
  captured_by_name TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  original_image_url TEXT NOT NULL,
  annotated_image_url TEXT,
  captured_at TIMESTAMPTZ NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  gps_accuracy NUMERIC(6, 2) NOT NULL,
  distance_from_site NUMERIC(8, 2) NOT NULL,
  location_verified BOOLEAN DEFAULT true,
  camera_capture_verified BOOLEAN DEFAULT true,
  capture_method TEXT DEFAULT 'DEVICE_CAMERA',
  sync_status TEXT DEFAULT 'synced',
  ai_analysis_status TEXT DEFAULT 'not_requested',
  ai_analysis_result JSONB,
  annotations_data TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quality Defects Table
CREATE TABLE IF NOT EXISTS public.quality_defects (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  inspection_id TEXT REFERENCES public.quality_inspections(id) ON DELETE SET NULL,
  photo_id TEXT,
  photo_url TEXT,
  project_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  location TEXT NOT NULL,
  issue TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  priority TEXT DEFAULT 'high',
  status TEXT DEFAULT 'open',
  assigned_to_id TEXT NOT NULL,
  assigned_to_name TEXT NOT NULL,
  reported_by_id TEXT NOT NULL,
  reported_by_name TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  corrective_action TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inspection Admin Configuration Table
CREATE TABLE IF NOT EXISTS public.inspection_admin_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  geofence_radius_meters INT DEFAULT 100,
  gps_verification_required BOOLEAN DEFAULT true,
  photo_required BOOLEAN DEFAULT true,
  minimum_photos INT DEFAULT 1,
  manual_camera_only BOOLEAN DEFAULT true,
  ai_analysis_enabled BOOLEAN DEFAULT true,
  allowed_approver_roles JSONB DEFAULT '["admin", "project_manager", "site_engineer"]'::jsonb,
  allowed_defect_creator_roles JSONB DEFAULT '["admin", "project_manager", "site_engineer", "supervisor", "inspector"]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inspection Audit Logs Table (Tamper-Resistant Proof Trail)
CREATE TABLE IF NOT EXISTS public.inspection_audit_logs (
  id TEXT PRIMARY KEY,
  inspection_id TEXT REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_by_name TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_inspections_project ON public.quality_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.quality_inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_insp ON public.inspection_photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_defects_project ON public.quality_defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON public.quality_defects(status);

-- Enable RLS
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_admin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_audit_logs ENABLE ROW LEVEL SECURITY;

-- Permissive authenticated RLS policies
CREATE POLICY "Allow authenticated read inspections" ON public.quality_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write inspections" ON public.quality_inspections FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read inspection photos" ON public.inspection_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write inspection photos" ON public.inspection_photos FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read defects" ON public.quality_defects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write defects" ON public.quality_defects FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read admin configs" ON public.inspection_admin_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write admin configs" ON public.inspection_admin_configs FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read audit logs" ON public.inspection_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write audit logs" ON public.inspection_audit_logs FOR ALL TO authenticated USING (true);
