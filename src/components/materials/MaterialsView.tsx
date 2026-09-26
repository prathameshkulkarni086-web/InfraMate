import React, { useState } from "react";
import {
  Boxes,
  Plus,
  AlertTriangle,
  FileDown,
  ArrowUpDown,
  Search,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  X,
  ShoppingCart,
  Building,
} from "lucide-react";
import { Material, Project, UserRole } from "../../types";
import { pdfService } from "../../services/pdfService";

interface MaterialsViewProps {
  materials: Material[];
  project: Project;
  onSaveMaterial: (material: Material) => void;
  onUpdateStock: (id: string, newQuantity: number) => void;
  userRole: UserRole;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  project,
  onSaveMaterial,
  onUpdateStock,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [selectedMaterialForAdjust, setSelectedMaterialForAdjust] = useState<Material | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<"inward" | "outward">("inward");

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    category: "Cement & Aggregates",
    quantity: 100,
    unit: "Bags",
    purchasePrice: 420,
    supplier: "",
    minimumStock: 40,
    location: "Main Site Shed A",
  });

  const categories = ["All", "Cement & Aggregates", "Steel & Metals", "Bricks & Blocks", "Paints & Finishes", "Plumbing & Electrical"];

  const filteredMaterials = materials.filter((m) => {
    const matchCat = selectedCategory === "All" || m.category === selectedCategory;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockItems = materials.filter((m) => m.quantity <= m.minimumStock);
  const totalValuation = materials.reduce((sum, m) => sum + m.quantity * m.purchasePrice, 0);

  const canManage = userRole === "admin" || userRole === "project_manager" || userRole === "site_engineer" || userRole === "supervisor";

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.name) return;

    const item: Material = {
      id: `mat-${Date.now()}`,
      projectId: project.id,
      name: newMaterial.name,
      category: newMaterial.category,
      quantity: Number(newMaterial.quantity),
      unit: newMaterial.unit as any,
      purchasePrice: Number(newMaterial.purchasePrice),
      supplierId: "sup-custom",
      supplierName: newMaterial.supplier || "Local Vendor",
      minimumStock: Number(newMaterial.minimumStock),
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    onSaveMaterial(item);
    setShowAddModal(false);
    setNewMaterial({
      name: "",
      category: "Cement & Aggregates",
      quantity: 100,
      unit: "Bags",
      purchasePrice: 420,
      supplier: "",
      minimumStock: 40,
      location: "Main Site Shed A",
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForAdjust || adjustAmount <= 0) return;

    const currentQty = selectedMaterialForAdjust.quantity;
    const newQty = adjustType === "inward" ? currentQty + adjustAmount : Math.max(0, currentQty - adjustAmount);

    onUpdateStock(selectedMaterialForAdjust.id, newQty);
    setShowAdjustModal(false);
    setSelectedMaterialForAdjust(null);
    setAdjustAmount(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Materials & Inventory Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock ledger, replenishment alerts, and supplier procurement for{" "}
            <span className="text-blue-600 font-semibold">{project.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => pdfService.generateMaterialReport(project, materials)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            <FileDown className="h-3.5 w-3.5 text-blue-600" />
            <span>Audit PDF</span>
          </button>

          {canManage && (
            <>
              <button
                onClick={() => setShowPoModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition"
              >
                <ShoppingCart className="h-3.5 w-3.5 text-slate-600" />
                <span>Generate PO</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Material SKU</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Critical Stock Alert Banner if items are low */}
      {lowStockItems.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 border border-red-200 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-red-900 text-sm">Critical Low-Stock Warning ({lowStockItems.length} SKUs)</div>
              <div className="text-red-700 text-xs">
                Items below safety reorder threshold:{" "}
                <span className="font-semibold">{lowStockItems.map((m) => m.name).join(", ")}</span>.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowPoModal(true)}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold px-3.5 py-2 text-xs shadow-xs transition shrink-0"
          >
            Auto Re-Order Items
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Inventory Valuation</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">₹{Math.round(totalValuation).toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">On-site stock asset value</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Tracked SKUs</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{materials.length} Materials</div>
          <div className="text-xs text-slate-500 mt-1">{categories.length - 1} trade categories</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stock Health Status</div>
          <div className="text-2xl font-bold mt-2">
            {lowStockItems.length === 0 ? (
              <span className="text-emerald-600 flex items-center gap-1.5 text-lg">
                <CheckCircle2 className="h-5 w-5" /> 100% Healthy
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1.5 text-lg">
                <AlertTriangle className="h-5 w-5" /> {lowStockItems.length} Low Stock
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">Automated buffer threshold calculation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search material SKU or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Materials List: Desktop Table + Mobile Cards */}
      {/* 1. Desktop & Tablet Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3.5">Material SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Current Stock</th>
                <th className="px-4 py-3.5">Min Reorder</th>
                <th className="px-4 py-3.5">Unit Price</th>
                <th className="px-4 py-3.5">Total Valuation</th>
                <th className="px-4 py-3.5">Supplier / Site Shed</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                {canManage && <th className="px-4 py-3.5 text-center">Stock Adjustment</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((mat) => {
                const isLow = mat.quantity <= mat.minimumStock;
                const itemVal = mat.quantity * mat.purchasePrice;

                return (
                  <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{mat.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Updated: {mat.lastUpdated}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                        {mat.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-900">
                        {mat.quantity} <span className="text-xs font-normal text-slate-500">{mat.unit}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {mat.minimumStock} {mat.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                      ₹{mat.purchasePrice.toLocaleString()} / {mat.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">
                      ₹{Math.round(itemVal).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      <div>{mat.supplier}</div>
                      {mat.location && <div className="text-[10px] text-slate-400">{mat.location}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Stocked
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => {
                            setSelectedMaterialForAdjust(mat);
                            setShowAdjustModal(true);
                          }}
                          className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs transition"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {filteredMaterials.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No materials found matching your filters.
          </div>
        ) : (
          filteredMaterials.map((mat) => {
            const isLow = mat.quantity <= mat.minimumStock;
            const itemVal = mat.quantity * mat.purchasePrice;

            return (
              <div
                key={mat.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 transition active:bg-slate-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">{mat.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                        {mat.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{mat.supplier}</span>
                    </div>
                  </div>
                  {isLow ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                      <AlertTriangle className="h-3 w-3" /> Low
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> OK
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Stock</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {mat.quantity} <span className="text-xs font-normal text-slate-500">{mat.unit}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Min Reorder</span>
                    <span className="text-slate-700 font-semibold">
                      {mat.minimumStock} {mat.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Unit Price</span>
                    <span className="text-slate-700 font-medium">₹{mat.purchasePrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Valuation</span>
                    <span className="text-slate-900 font-bold">₹{Math.round(itemVal).toLocaleString()}</span>
                  </div>
                </div>

                {canManage && (
                  <button
                    onClick={() => {
                      setSelectedMaterialForAdjust(mat);
                      setShowAdjustModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 min-h-[44px] transition active:scale-[0.99]"
                  >
                    Adjust Stock Level
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedMaterialForAdjust && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Stock Level</h3>
                <p className="text-xs text-blue-600 font-semibold">{selectedMaterialForAdjust.name}</p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
                <span className="text-slate-500">Current Stock On Site:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedMaterialForAdjust.quantity} {selectedMaterialForAdjust.unit}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Transaction Type</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("inward")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg p-2.5 text-xs font-semibold border min-h-[44px] transition ${
                      adjustType === "inward"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" /> Inward Received
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("outward")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg p-2.5 text-xs font-semibold border min-h-[44px] transition ${
                      adjustType === "outward"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" /> Outward Consumed
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Quantity ({selectedMaterialForAdjust.unit}) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustAmount || ""}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  placeholder={`Amount in ${selectedMaterialForAdjust.unit}`}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px] text-sm"
                />
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold min-h-[44px] transition flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 shadow-xs min-h-[44px] transition flex items-center justify-center"
                >
                  Record Stock Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Material SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Add New Material SKU</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 sm:space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Material SKU Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TMT Steel Bars (12mm Fe550D)"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={newMaterial.category}
                    onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  >
                    <option value="Cement & Aggregates">Cement & Aggregates</option>
                    <option value="Steel & Metals">Steel & Metals</option>
                    <option value="Bricks & Blocks">Bricks & Blocks</option>
                    <option value="Paints & Finishes">Paints & Finishes</option>
                    <option value="Plumbing & Electrical">Plumbing & Electrical</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bags, Tons, Sq.ft, Liters"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Initial Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={newMaterial.quantity}
                    onChange={(e) => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unit Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newMaterial.purchasePrice}
                    onChange={(e) => setNewMaterial({ ...newMaterial, purchasePrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Min Alert Threshold</label>
                  <input
                    type="number"
                    min={1}
                    value={newMaterial.minimumStock}
                    onChange={(e) => setNewMaterial({ ...newMaterial, minimumStock: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Tiscon Dealers"
                    value={newMaterial.supplier}
                    onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Yard 2 / Shed B"
                    value={newMaterial.location}
                    onChange={(e) => setNewMaterial({ ...newMaterial, location: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold min-h-[44px] transition flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 shadow-xs min-h-[44px] transition flex items-center justify-center"
                >
                  Catalog Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Purchase Order Generator Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in safe-bottom">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl safe-bottom touch-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Generate Material Purchase Order</h2>
              </div>
              <button
                onClick={() => setShowPoModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Auto-aggregated items requiring replenishment based on min-stock safety threshold:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto touch-scroll">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((m) => (
                    <div key={m.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-500">Supplier: {m.supplier}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-blue-600">Order: +{m.minimumStock * 2} {m.unit}</div>
                        <div className="text-[10px] text-slate-500">Est. ₹{(m.minimumStock * 2 * m.purchasePrice).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                    All material SKUs are currently above minimum safety thresholds.
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="rounded-lg px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold min-h-[44px] transition text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("Purchase Order PO-2026-901 generated and dispatched to supplier email & WhatsApp gateway!");
                    setShowPoModal(false);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 shadow-xs min-h-[44px] transition text-center"
                >
                  Transmit PO to Vendors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
