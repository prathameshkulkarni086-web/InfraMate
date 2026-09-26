import React from "react";
import { Worker, AttendanceRecord, Project, ProjectSite, UserRole } from "../../types";
import { LaborModule } from "./LaborModule";

interface LaborViewProps {
  workers: Worker[];
  attendance: AttendanceRecord[];
  projects: Project[];
  activeProject: Project;
  onSaveWorker: (worker: Worker) => void;
  onDeleteWorker: (id: string) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onSaveGeofence: (
    radiusMeters: number,
    siteLat: number,
    siteLng: number,
    sites?: ProjectSite[]
  ) => void;
  onApprovePayroll: (
    totalAmount: number,
    periodLabel: string,
    approvedBy: string
  ) => void;
  onManualOverride: (
    recordId: string,
    newStatus: string,
    reason: string
  ) => void;
  onTransferWorker: (
    workerId: string,
    newProjectId: string,
    newSiteId?: string,
    newSiteName?: string
  ) => void;
  userRole: UserRole;
  currentUserName: string;
}

export const LaborView: React.FC<LaborViewProps> = (props) => {
  return <LaborModule {...props} onUpdateWorker={props.onSaveWorker} />;
};
