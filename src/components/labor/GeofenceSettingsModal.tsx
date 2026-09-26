import React, { useState } from "react";
import {
  MapPin,
  Compass,
  Check,
  X,
  Sliders,
  Layers,
  Plus,
  Trash2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Project, ProjectSite } from "../../types";

interface GeofenceSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSaveGeofence: (
    radiusMeters: number,
    siteLat: number,
    siteLng: number,
    sites?: ProjectSite[]
  ) => void;
  canConfigure: boolean;
}

export const GeofenceSettingsModal: React.FC<GeofenceSettingsModalProps> = ({
  project,
  isOpen,
  onClose,
  onSaveGeofence,
  canConfigure,
}) => {
  const [radius, setRadius] = useState<number>(project.attendanceRadiusMeters || 100);
  const [customRadiusInput, setCustomRadiusInput] = useState<string>(
    String(project.attendanceRadiusMeters || 100)
  );
  const [isCustom, setIsCustom] = useState<boolean>(
    ![50, 100, 150, 200].includes(project.attendanceRadiusMeters || 100)
  );

  const [lat, setLat] = useState<number>(project.siteLatitude || 12.971598);
  const [lng, setLng] = useState<number>(project.siteLongitude || 77.594566);

  const [subSites, setSubSites] = useState<ProjectSite[]>(
    project.sites || [
      {
        id: `site-${Date.now()}-1`,
        projectId: project.id,
        name: "Main Structure & RCC Core",
        latitude: project.siteLatitude || 12.971598,
        longitude: project.siteLongitude || 77.594566,
        attendanceRadiusMeters: 100,
      },
    ]
  );

  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteRadius, setNewSiteRadius] = useState<number>(100);

  if (!isOpen) return null;

  const presetRadiuses = [50, 100, 150, 200];

  const handleSelectPreset = (val: number) => {
    setIsCustom(false);
    setRadius(val);
    setCustomRadiusInput(String(val));
  };

  const handleCustomChange = (valStr: string) => {
    setCustomRadiusInput(valStr);
    const num = Number(valStr);
    if (!isNaN(num) && num > 0) {
      setRadius(num);
    }
  };

  const handleAddSubSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) return;

    const newSub: ProjectSite = {
      id: `site-${Date.now()}`,
      projectId: project.id,
      name: newSiteName.trim(),
      latitude: Number(lat) + (Math.random() - 0.5) * 0.0005,
      longitude: Number(lng) + (Math.random() - 0.5) * 0.0005,
      attendanceRadiusMeters: Number(newSiteRadius) || 100,
    };

    setSubSites([...subSites, newSub]);
    setNewSiteName("");
    setNewSiteRadius(100);
  };

  const handleRemoveSubSite = (id: string) => {
    if (subSites.length <= 1) return;
    setSubSites(subSites.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    const finalRadius = isCustom ? Number(customRadiusInput) || 100 : radius;
    onSaveGeofence(finalRadius, lat, lng, subSites);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Site Geofence & Attendance Radius Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Configure GPS boundaries for {project.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {!canConfigure && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Read-only mode: Only Project Managers or Administrators can modify site geofence coordinates and radiuses.
              </span>
            </div>
          )}

          {/* Radius Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Default Attendance Radius ({radius} meters)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {presetRadiuses.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={!canConfigure}
                  onClick={() => handleSelectPreset(r)}
                  className={`px-3 py-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 ${
                    !isCustom && radius === r
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="text-sm">{r} m</span>
                  <span className="text-[10px] opacity-70">
                    {r === 100 ? "Recommended" : r < 100 ? "Compact Site" : "Expansive Site"}
                  </span>
                </button>
              ))}

              <button
                type="button"
                disabled={!canConfigure}
                onClick={() => setIsCustom(true)}
                className={`px-3 py-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 ${
                  isCustom
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-sm"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="text-sm">Custom</span>
                <span className="text-[10px] opacity-70">Custom Metres</span>
              </button>
            </div>

            {isCustom && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  disabled={!canConfigure}
                  value={customRadiusInput}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="w-36 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. 120"
                />
                <span className="text-xs text-slate-500">
                  Meters from site center coordinates
                </span>
              </div>
            )}
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Site Latitude
              </label>
              <input
                type="number"
                step="any"
                disabled={!canConfigure}
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Site Longitude
              </label>
              <input
                type="number"
                step="any"
                disabled={!canConfigure}
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
              />
            </div>
          </div>

          {/* Multi-Site Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Project Sub-Sites & Zones ({subSites.length})
              </label>
              <span className="text-[11px] text-slate-500">
                Workers can be assigned to designated sub-zones
              </span>
            </div>

            <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-800/30">
              {subSites.map((site, index) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {site.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Radius: {site.attendanceRadiusMeters}m | Lat: {site.latitude.toFixed(5)}, Lng: {site.longitude.toFixed(5)}
                      </div>
                    </div>
                  </div>

                  {canConfigure && subSites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubSite(site.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="Remove sub-site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {canConfigure && (
                <form onSubmit={handleAddSubSite} className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add sub-site/zone (e.g. Basement Parking, Clubhouse)"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    min="20"
                    max="500"
                    placeholder="Radius (m)"
                    value={newSiteRadius}
                    onChange={(e) => setNewSiteRadius(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Zone
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Visual Geofence Map / Radar simulation */}
          <div className="p-4 rounded-xl bg-slate-900 text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[140px] border border-slate-800">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="w-28 h-28 rounded-full border border-dashed border-emerald-400/60 flex items-center justify-center animate-pulse relative">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="absolute -top-3 text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400">
                {radius}m Radius
              </span>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-semibold text-slate-200">
                Active Geofence: {project.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Lat: {lat.toFixed(6)}° N | Long: {lng.toFixed(6)}° E
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          {canConfigure && (
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Geofence Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
