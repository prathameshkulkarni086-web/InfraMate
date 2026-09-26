import React from "react";
import { Equipment } from "../../types";
import { Truck, MapPin, Activity, CheckCircle2, Wrench, AlertCircle, PlayCircle } from "lucide-react";

interface EquipmentListProps {
  equipment: Equipment[];
  searchQuery: string;
  onSelectEquipment: (id: string) => void;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  equipment,
  searchQuery,
  onSelectEquipment,
}) => {
  const filtered = equipment.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Equipment["status"]) => {
    switch (status) {
      case "Available": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "In Use": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Under Maintenance": return "bg-red-100 text-red-700 border-red-200";
      case "Maintenance Due": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: Equipment["status"]) => {
    switch (status) {
      case "Available": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "In Use": return <PlayCircle className="w-3.5 h-3.5" />;
      case "Under Maintenance": return <Wrench className="w-3.5 h-3.5" />;
      case "Maintenance Due": return <AlertCircle className="w-3.5 h-3.5" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No equipment found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Equipment Info</th>
                <th className="px-6 py-4 font-medium">Type / Model</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Ownership</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => onSelectEquipment(e.id)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{e.name}</p>
                        <p className="text-xs text-slate-500">{e.assetId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{e.type}</p>
                    <p className="text-xs text-slate-500">{e.brand} {e.model}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(e.status)}`}>
                      {getStatusIcon(e.status)}
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{e.ownership}</p>
                    {e.ownership === "Rented" && e.vendor && (
                      <p className="text-xs text-slate-500">{e.vendor}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSelectEquipment(e.id);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((e) => (
          <div
            key={e.id}
            onClick={() => onSelectEquipment(e.id)}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{e.name}</p>
                  <p className="text-xs font-mono text-slate-500">{e.assetId}</p>
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusColor(e.status)}`}>
                {getStatusIcon(e.status)}
                {e.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Type / Model</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{e.type}</span>
                <span className="text-[11px] text-slate-500 block truncate">{e.brand} {e.model}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ownership</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{e.ownership}</span>
                {e.vendor && <span className="text-[11px] text-slate-500 block truncate">{e.vendor}</span>}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end">
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  onSelectEquipment(e.id);
                }}
                className="w-full min-h-[44px] flex items-center justify-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
              >
                View Equipment Profile & Logs
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
