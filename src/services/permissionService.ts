import { User, PermissionKey, ALL_PERMISSIONS, DEFAULT_ROLE_PRESETS } from "../types";
import { FEATURES } from "../config/features";

export class PermissionService {
  /**
   * Evaluates if a user has a specific granular permission.
   * STRICT ENFORCEMENT: Account must be active and permission must exist in user's manual permission array.
   */
  hasPermission(user: User | null | undefined, permission: PermissionKey): boolean {
    if (!user) return false;
    if (user.status === "disabled") return false;
    // Real manual permission check:
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  hasAnyPermission(user: User | null | undefined, permissions: PermissionKey[]): boolean {
    if (!user || user.status === "disabled") return false;
    return permissions.some((perm) => this.hasPermission(user, perm));
  }

  /**
   * Check if user has ALL specified permissions
   */
  hasAllPermissions(user: User | null | undefined, permissions: PermissionKey[]): boolean {
    if (!user || user.status === "disabled") return false;
    return permissions.every((perm) => this.hasPermission(user, perm));
  }

  /**
   * Determines if a user can access a specific application tab / module
   */
  canAccessTab(user: User | null | undefined, tabId: string): boolean {
    if (!user) return false;
    if (user.status === "disabled") return false;

    switch (tabId) {
      case "dashboard":
        return this.hasPermission(user, "view_dashboard");
      case "projects":
        return this.hasAnyPermission(user, ["view_projects", "manage_projects", "create_edit_delete_projects"]);
      case "expenses":
        return this.hasAnyPermission(user, ["view_expenses", "manage_expenses", "create_edit_delete_expenses"]);
      case "materials":
        return this.hasAnyPermission(user, ["view_materials", "manage_materials", "create_edit_delete_materials"]);
      case "equipment":
        return this.hasAnyPermission(user, ["view_equipment", "manage_equipment", "create_edit_delete_equipment"]);
      case "labor":
        return this.hasAnyPermission(user, ["view_labor", "manage_labor", "create_edit_delete_labor", "manage_attendance"]);
      case "progress":
        return this.hasAnyPermission(user, ["manage_progress", "upload_site_photos"]);
      case "quality_inspections":
        return this.hasAnyPermission(user, ["manage_quality_inspections", "upload_site_photos"]);
      case "reports":
        return this.hasPermission(user, "generate_view_download_reports");
      case "ai_assistant":
      case "ai_cost":
        return this.hasPermission(user, "use_ai_assistant");
      case "building_visualizer":
        if (!FEATURES.visualizer2D3D) return false;
        return this.hasPermission(user, "use_building_visualizer");
      case "access_control":
        return this.hasAnyPermission(user, ["manage_users", "manage_roles_permissions"]);
      case "settings":
        return this.hasPermission(user, "manage_settings");
      case "support":
        return this.hasAnyPermission(user, ["view_support", "manage_support", "view_transactions", "manage_transactions", "view_dashboard"]);
      case "portfolio":
        return this.hasAnyPermission(user, ["view_projects", "view_dashboard"]);
      default:
        return true;
    }
  }

  /**
   * Returns human-readable required permission name for a tab
   */
  getRequiredPermissionForTab(tabId: string): { key: PermissionKey; label: string } {
    switch (tabId) {
      case "dashboard":
        return { key: "view_dashboard", label: "View Dashboard" };
      case "support":
        return { key: "view_support", label: "View Support & Transactions" };
      case "projects":
        return { key: "view_projects", label: "View Projects" };
      case "expenses":
        return { key: "view_expenses", label: "View Expenses" };
      case "materials":
        return { key: "view_materials", label: "View Materials" };
      case "labor":
        return { key: "view_labor", label: "View Labor" };
      case "progress":
        return { key: "manage_progress", label: "Manage Progress" };
      case "quality_inspections":
        return { key: "manage_quality_inspections", label: "Manage Quality Inspections" };
      case "reports":
        return { key: "generate_view_download_reports", label: "Generate Reports" };
      case "ai_assistant":
      case "ai_cost":
        return { key: "use_ai_assistant", label: "Use AI Assistant" };
      case "building_visualizer":
        return { key: "use_building_visualizer", label: "Use Building Visualizer" };
      case "access_control":
        return { key: "manage_roles_permissions", label: "Manage Roles & Permissions" };
      case "settings":
        return { key: "manage_settings", label: "Manage Settings" };
      default:
        return { key: "view_dashboard", label: "View Dashboard" };
    }
  }

  /**
   * Compares user's current permissions with default template for their role
   */
  isOverriddenFromTemplate(user: User): boolean {
    const preset = DEFAULT_ROLE_PRESETS.find((r) => r.role === user.role);
    if (!preset) return true; // Custom role is always custom
    
    if (preset.defaultPermissions.length !== user.permissions.length) return true;
    const sortedPreset = [...preset.defaultPermissions].sort();
    const sortedUser = [...user.permissions].sort();
    return !sortedPreset.every((val, index) => val === sortedUser[index]);
  }

  /**
   * Generates the production Firebase Security Rules string enforcing this manual model
   */
  getFirebaseSecurityRules(): string {
    return `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user is authenticated and active
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAccountActive() {
      return isAuthenticated() && 
        (request.auth.token.status == 'active' || getUserData().status == 'active');
    }
    
    // Granular Manual Permission Verifier (Checks user's explicit permissions array)
    function hasPermission(permKey) {
      return isAccountActive() && 
        (
          (request.auth.token.permissions != null && permKey in request.auth.token.permissions) ||
          (getUserData().permissions != null && permKey in getUserData().permissions)
        );
    }
    
    function hasAnyPermission(permList) {
      return isAccountActive() && permList.hasAny(getUserData().permissions);
    }

    // =========================================================================
    // USERS & IAM ACCESS MANAGEMENT (Admin Controlled)
    // =========================================================================
    match /users/{userId} {
      // Anyone active can read user profiles (for author names)
      allow read: if isAccountActive();
      // Only Admin / IAM managers can create, update, or assign permissions
      allow create, delete: if hasPermission('manage_users');
      allow update: if hasPermission('manage_users') || hasPermission('manage_roles_permissions');
    }

    // =========================================================================
    // PROJECTS & PHASES
    // =========================================================================
    match /projects/{projectId} {
      allow read: if hasAnyPermission(['view_projects', 'manage_projects', 'create_edit_delete_projects', 'view_dashboard']);
      allow create, delete: if hasPermission('create_edit_delete_projects');
      allow update: if hasAnyPermission(['manage_projects', 'create_edit_delete_projects']);
    }

    // =========================================================================
    // EXPENSES & FINANCIAL LEDGER
    // =========================================================================
    match /expenses/{expenseId} {
      allow read: if hasAnyPermission(['view_expenses', 'manage_expenses', 'create_edit_delete_expenses']);
      allow create: if hasAnyPermission(['manage_expenses', 'create_edit_delete_expenses']);
      allow update: if hasAnyPermission(['manage_expenses', 'create_edit_delete_expenses']);
      allow delete: if hasPermission('create_edit_delete_expenses');
    }

    // =========================================================================
    // MATERIALS & WAREHOUSE INVENTORY
    // =========================================================================
    match /materials/{materialId} {
      allow read: if hasAnyPermission(['view_materials', 'manage_materials', 'create_edit_delete_materials']);
      allow create, delete: if hasPermission('create_edit_delete_materials');
      allow update: if hasAnyPermission(['manage_materials', 'create_edit_delete_materials']);
    }

    // =========================================================================
    // WORKFORCE & MUSTER ROLL ATTENDANCE
    // =========================================================================
    match /workers/{workerId} {
      allow read: if hasAnyPermission(['view_labor', 'manage_labor', 'create_edit_delete_labor']);
      allow create, delete: if hasPermission('create_edit_delete_labor');
      allow update: if hasAnyPermission(['manage_labor', 'create_edit_delete_labor']);
    }

    match /attendance/{attendanceId} {
      allow read: if hasAnyPermission(['view_labor', 'manage_attendance']);
      allow create, update: if hasPermission('manage_attendance');
      allow delete: if hasPermission('manage_labor');
    }

    // =========================================================================
    // SITE PROGRESS, TASKS & INSPECTION PHOTOS
    // =========================================================================
    match /progress_logs/{logId} {
      allow read: if isAccountActive();
      allow create: if hasAnyPermission(['manage_progress', 'upload_site_photos']);
      allow update, delete: if hasPermission('manage_progress');
    }

    match /tasks/{taskId} {
      allow read: if isAccountActive();
      allow create, update, delete: if hasPermission('manage_progress');
    }

    // =========================================================================
    // AUDIT LOGS
    // =========================================================================
    match /audit_logs/{auditId} {
      allow read: if hasPermission('manage_roles_permissions');
      allow create: if isAuthenticated();
      allow update, delete: if false; // Immutable audit log
    }
  }
}`;
  }

  /**
   * Generates sample Node.js Express authorization middleware
   */
  getBackendMiddlewareCode(): string {
    return `// backend/middleware/authorize.ts
import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  status: "active" | "disabled";
  permissions: string[];
}

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing authorization header" });
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Fetch user record from Firestore to ensure real-time permission sync
      const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        return res.status(403).json({ error: "Access Denied: User profile not found" });
      }

      const userData = userDoc.data() as AuthenticatedUser;
      
      // Check 1: Account status check
      if (userData.status === "disabled") {
        return res.status(403).json({ 
          error: "Account Disabled: Contact Admin to reactivate your access." 
        });
      }

      // Check 2: Granular manual permission check
      if (!userData.permissions || !userData.permissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          error: \`Access Denied: Missing required permission '\${requiredPermission}'. Access must be manually granted by the Admin.\`,
          requiredPermission 
        });
      }

      // User authorized
      (req as any).user = userData;
      next();
    } catch (err: any) {
      return res.status(401).json({ error: "Authentication failed", details: err.message });
    }
  };
};`;
  }
}

export const permissionService = new PermissionService();
