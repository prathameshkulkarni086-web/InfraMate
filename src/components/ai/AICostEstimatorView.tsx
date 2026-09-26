import React, { useState } from "react";
import {
  Calculator,
  Sparkles,
  Layers,
  Building,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";
import { BoqEstimate } from "../../types";
import { aiService } from "../../services/aiService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const AICostEstimatorView: React.FC = () => {
  const [params, setParams] = useState({
    plotArea: 2000,
    floors: 2,
    bedrooms: 3,
    bathrooms: 3,
    finishQuality: "Standard",
    locationTier: "Tier 1 (Metro)",
    structureType: "RCC Framed Structure",
  });

  const [estimate, setEstimate] = useState<BoqEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await aiService.estimateCost(params);
      setEstimate(result);
    } catch (err) {
      console.error("Cost estimation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    handleGenerate();
  }, []);

  const categoryBreakdownData = estimate
    ? [
        { name: "Materials (52%)", value: estimate.breakdown.materials.amountINR, color: "#f59e0b" },
        { name: "Labor (24%)", value: estimate.breakdown.labor.amountINR, color: "#38bdf8" },
        { name: "Equipment (9%)", value: estimate.breakdown.equipment.amountINR, color: "#a855f7" },
        { name: "Permits & Architectural (10%)", value: estimate.breakdown.permitsAndArchitect.amountINR, color: "#10b981" },
        { name: "Contingency Buffer (5%)", value: estimate.breakdown.contingency.amountINR, color: "#f43f5e" },
      ]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">AI Construction Cost & BOQ Estimator</h1>
            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
              <Sparkles className="h-3 w-3" /> Gemini 2.5 Pro
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated Bill of Quantities (BOQ), material volumetric forecasting, and stage-wise cash flow analysis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Parameter Inputs & Sliders */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Calculator className="h-4 w-4 text-amber-400" />
            <span>Building Specifications</span>
          </h2>

          <div className="space-y-4 text-xs">
            {/* Plot Area */}
            <div>
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>Plot / Built-up Area</span>
                <span className="text-amber-400 font-bold">{params.plotArea.toLocaleString()} sq.ft</span>
              </div>
              <input
                type="range"
                min={500}
                max={15000}
                step={100}
                value={params.plotArea}
                onChange={(e) => setParams({ ...params, plotArea: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Floors */}
            <div>
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>Number of Floors (G+N)</span>
                <span className="text-amber-400 font-bold">G+{params.floors - 1} ({params.floors} Floors)</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={params.floors}
                onChange={(e) => setParams({ ...params, floors: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300">Bedrooms (BHK)</label>
                <select
                  value={params.bedrooms}
                  onChange={(e) => setParams({ ...params, bedrooms: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value={1}>1 BHK</option>
                  <option value={2}>2 BHK</option>
                  <option value={3}>3 BHK</option>
                  <option value={4}>4 BHK</option>
                  <option value={5}>5+ Luxury</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300">Bathrooms</label>
                <select
                  value={params.bathrooms}
                  onChange={(e) => setParams({ ...params, bathrooms: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value={1}>1 Bath</option>
                  <option value={2}>2 Baths</option>
                  <option value={3}>3 Baths</option>
                  <option value={4}>4 Baths</option>
                  <option value={5}>5+ Baths</option>
                </select>
              </div>
            </div>

            {/* Finish Quality */}
            <div>
              <label className="font-semibold text-slate-300">Finish Quality Grade</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {["Economy", "Standard", "Premium", "Ultra Luxury"].map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setParams({ ...params, finishQuality: grade })}
                    className={`rounded-xl p-2 font-semibold border transition ${
                      params.finishQuality === grade
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Tier */}
            <div>
              <label className="font-semibold text-slate-300">Location Cost Index</label>
              <select
                value={params.locationTier}
                onChange={(e) => setParams({ ...params, locationTier: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Tier 1 (Metro)">Tier 1 (Metro - Mumbai, Delhi, Bengaluru)</option>
                <option value="Tier 2 (City)">Tier 2 (City - Pune, Ahmedabad, Jaipur)</option>
                <option value="Tier 3 (Town/Semi-Urban)">Tier 3 (Town / Semi-Urban)</option>
              </select>
            </div>

            {/* Structure Type */}
            <div>
              <label className="font-semibold text-slate-300">Structural System</label>
              <select
                value={params.structureType}
                onChange={(e) => setParams({ ...params, structureType: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="RCC Framed Structure">RCC Framed Structure (Recommended)</option>
                <option value="Load Bearing Masonry">Load Bearing Masonry</option>
                <option value="Pre-engineered Steel (PEB)">Pre-engineered Steel (PEB)</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Computing Detailed BOQ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Compute AI BOQ & Cost Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 2 Cols: AI BOQ Estimate Output */}
        <div className="lg:col-span-2 space-y-6">
          {estimate && (
            <>
              {/* Output Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300">Total Estimated Budget</div>
                  <div className="text-2xl font-black text-white mt-1">
                    ₹{estimate.totalEstimatedCostINR.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-amber-200/80 mt-1 font-semibold">
                    ₹{estimate.costPerSqFtINR} / sq.ft (Built-up)
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">USD Conversion</div>
                  <div className="text-2xl font-black text-white mt-1">
                    ${estimate.totalEstimatedCostUSD.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Standard 1 USD ≈ 85.5 INR</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Contingency Buffer (5%)</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ₹{estimate.breakdown.contingency.amountINR.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Emergency price volatility hedge</div>
                </div>
              </div>

              {/* Itemized Materials BOQ Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Itemized Material Quantities & Cost Matrix</h3>
                    <p className="text-xs text-slate-400">Calculated based on standard IS456 volumetric coefficients</p>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    {estimate.keyMaterialQuantities.length} Major Trade Lines
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Material Trade</th>
                        <th className="p-3">Required Quantity</th>
                        <th className="p-3">Est. Unit Rate</th>
                        <th className="p-3 text-right">Subtotal Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {estimate.keyMaterialQuantities.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-slate-200">{item.item}</td>
                          <td className="p-3 text-amber-300 font-mono">{item.quantity}</td>
                          <td className="p-3 text-slate-400">{item.estimatedRate}</td>
                          <td className="p-3 text-right font-black text-white">{item.totalCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stage-wise Cashflow Schedule Bar Chart */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Stage-Wise Cashflow Disbursement Schedule</h3>
                  <p className="text-xs text-slate-400">Projected contractor billing checkpoints</p>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={estimate.milestoneCashflow} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="stage" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Amount"]}
                      />
                      <Bar dataKey="estimatedAmountINR" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Cashflow (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Cost-Saving Recommendations */}
              {estimate.costSavingRecommendations && estimate.costSavingRecommendations.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs uppercase tracking-wider">
                    <Lightbulb className="h-4 w-4" />
                    <span>AI Engineering Cost Optimization Insights</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {estimate.costSavingRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
