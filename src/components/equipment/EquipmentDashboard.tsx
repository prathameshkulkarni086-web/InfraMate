import React from "react";
import { Equipment, EquipmentUsageLog, FuelLog, MaintenanceRecord } from "../../types";
import { Truck, Activity, Fuel, Wrench, AlertCircle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface EquipmentDashboardProps {
  equipment: Equipment[];
  usage: EquipmentUsageLog[];
  fuelLogs: FuelLog[];
  maintenance: MaintenanceRecord[];
}

export const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({
  equipment,
  usage,
  fuelLogs,
  maintenance,
}) => {
  const totalEquipment = equipment.length;
  const available = equipment.filter((e) => e.status === "Available").length;
  const inUse = equipment.filter((e) => e.status === "In Use").length;
  const underMaintenance = equipment.filter((e) => e.status === "Under Maintenance" || e.status === "Maintenance Due").length;
  
  const rentedEquipment = equipment.filter((e) => e.ownership === "Rented").length;
  const totalFuelCost = fuelLogs.reduce((acc, f) => acc + f.totalCost, 0);
  const totalMaintenanceCost = maintenance.reduce((acc, m) => acc + m.cost, 0);

  // Example fuel usage chart data
  const fuelData = [
    { name: "Mon", cost: 1200 },
    { name: "Tue", cost: 1900 },
    { name: "Wed", cost: 800 },
    { name: "Thu", cost: 2400 },
    { name: "Fri", cost: 1100 },
    { name: "Sat", cost: 500 },
    { name: "Sun", cost: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total Equipment</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalEquipment}</h3>
            </div>
            <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{available} Available</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">In Use</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{inUse}</h3>
            </div>
            <div className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex gap-4 text-xs sm:text-sm">
            <span className="text-slate-500">Active at sites</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Maintenance</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{underMaintenance}</h3>
            </div>
            <div className="p-1.5 sm:p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500 truncate">
            ₹{totalMaintenanceCost.toLocaleString()} spent
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total Fuel Cost</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{totalFuelCost.toLocaleString()}
              </h3>
            </div>
            <div className="p-1.5 sm:p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <Fuel className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500 truncate">
            across {fuelLogs.length} logs
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Fuel Consumption (Past Week)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Maintenance Alerts</h3>
          <div className="space-y-4">
            {equipment.filter((e) => e.status === "Maintenance Due" || e.status === "Under Maintenance").length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p>No maintenance alerts currently.</p>
              </div>
            ) : (
              equipment
                .filter((e) => e.status === "Maintenance Due" || e.status === "Under Maintenance")
                .map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">{e.name} ({e.assetId})</p>
                      <p className="text-xs text-amber-700">{e.status === "Under Maintenance" ? "Currently under maintenance." : "Routine maintenance due."}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
