"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingDown,
  AlertTriangle,
  Calendar,
  Loader,
  Car,
  BarChart3,
  PieChart,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
  Legend,
} from "recharts";
import vehicleModelService from "@/services/vehicleModelService";

interface ProblematicModel {
  vehicleModelId: string;
  vehicleModelName: string;
  sku: string;
  totalIssues: number;
  companyName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Add index signature for recharts compatibility
}

export function MostProblematicModels() {
  const [models, setModels] = useState<ProblematicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "bar" | "pie">("bar");

  const fetchProblematicModels = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: { limit: number; startDate?: string; endDate?: string } = {
        limit,
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await vehicleModelService.getMostProblematicModels(
        params
      );
      setModels(response.models);
    } catch (err: unknown) {
      console.error("Error fetching problematic models:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [limit, startDate, endDate]);

  useEffect(() => {
    fetchProblematicModels();
  }, [fetchProblematicModels]);

  // Chart color palette matching your design system
  const CHART_COLORS = [
    "#ef4444", // red-500
    "#f97316", // orange-500
    "#f59e0b", // amber-500
    "#eab308", // yellow-500
    "#84cc16", // lime-500
    "#22c55e", // green-500
    "#10b981", // emerald-500
    "#14b8a6", // teal-500
    "#06b6d4", // cyan-500
    "#0ea5e9", // sky-500
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: ProblematicModel;
      value: number;
    }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4">
          <p className="font-bold text-gray-900 mb-2 text-base">
            {payload[0].payload.vehicleModelName}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            SKU:{" "}
            <span className="font-mono font-semibold">
              {payload[0].payload.sku}
            </span>
          </p>
          {payload[0].payload.companyName && (
            <p className="text-sm text-gray-600 mb-3 pb-3 border-b border-gray-200">
              {payload[0].payload.companyName}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-2xl font-bold text-red-600">
              {payload[0].value.toLocaleString()}
            </p>
            <span className="text-sm text-gray-600 font-medium">issues</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Loading problematic models...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
              <TrendingDown className="w-7 h-7 text-white" />
            </div>
            Most Problematic Vehicle Models
          </h1>
          <p className="text-gray-600 ml-16">
            Vehicle models ranked by total case lines (issues) reported
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            {/* View Mode Toggle */}
            <div className="flex-shrink-0">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                View Mode
              </label>
              <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <button
                  onClick={() => setViewMode("bar")}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === "bar"
                      ? "bg-white shadow-sm text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1.5" />
                  Bar Chart
                </button>
                <button
                  onClick={() => setViewMode("pie")}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === "pie"
                      ? "bg-white shadow-sm text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <PieChart className="w-4 h-4 inline mr-1.5" />
                  Pie Chart
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 inline mr-1.5" />
                  List View
                </button>
              </div>
            </div>

            {/* Limit */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Show Top
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value={5}>5 Models</option>
                <option value={10}>10 Models</option>
                <option value={20}>20 Models</option>
                <option value={50}>50 Models</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex-1 min-w-[200px]">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Clear Button */}
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-5 py-2.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold rounded-xl transition-colors"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Error Loading Data
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {models.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold text-lg mb-2">
                No problematic models found
              </p>
              <p className="text-sm text-gray-500">
                Try adjusting the date range or limit to see results
              </p>
            </div>
          ) : (
            <>
              {/* Bar Chart View */}
              {viewMode === "bar" && (
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={models}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <defs>
                        <linearGradient
                          id="barGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ef4444"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor="#dc2626"
                            stopOpacity={0.7}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="vehicleModelName"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        stroke="#d1d5db"
                      />
                      <YAxis
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        stroke="#d1d5db"
                        label={{
                          value: "Total Issues",
                          angle: -90,
                          position: "insideLeft",
                          style: { fill: "#374151", fontWeight: 600 },
                        }}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "#f9fafb" }}
                      />
                      <Bar
                        dataKey="totalIssues"
                        fill="url(#barGradient)"
                        radius={[8, 8, 0, 0]}
                      >
                        {models.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#barGradient)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Pie Chart View */}
              {viewMode === "pie" && (
                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Issue Breakdown
                    </h3>
                    <p className="text-sm text-gray-600">
                      Percentage distribution of issues across vehicle models
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={550}>
                    <RePieChart>
                      <defs>
                        {models.map((_, index) => (
                          <linearGradient
                            key={`gradient-${index}`}
                            id={`pieGradient-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={
                                CHART_COLORS[index % CHART_COLORS.length]
                              }
                              stopOpacity={1}
                            />
                            <stop
                              offset="100%"
                              stopColor={
                                CHART_COLORS[index % CHART_COLORS.length]
                              }
                              stopOpacity={0.7}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={models}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={(entry: any) =>
                          entry.percent
                            ? `${entry.vehicleModelName}: ${(
                                entry.percent * 100
                              ).toFixed(1)}%`
                            : ""
                        }
                        outerRadius={150}
                        innerRadius={80}
                        dataKey="totalIssues"
                        paddingAngle={2}
                      >
                        {models.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#pieGradient-${index})`}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{
                          paddingTop: "20px",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="p-6 space-y-3">
                  {models.map((model, index) => (
                    <motion.div
                      key={model.vehicleModelId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      {/* Rank Badge */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-red-100 text-red-700 ring-2 ring-red-200"
                            : index === 1
                            ? "bg-orange-100 text-orange-700 ring-2 ring-orange-200"
                            : index === 2
                            ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Model Icon */}
                      <div className="flex-shrink-0 p-3 bg-white rounded-lg border border-gray-200">
                        <Car className="w-6 h-6 text-gray-600" />
                      </div>

                      {/* Model Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                          {model.vehicleModelName}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                            SKU: {model.sku}
                          </span>
                          {model.companyName && (
                            <span>• {model.companyName}</span>
                          )}
                        </div>
                      </div>

                      {/* Issue Count */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <div className="text-3xl font-bold text-red-600">
                            {model.totalIssues.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Total Issues
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary */}
        {models.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Analysis Summary</p>
                <p>
                  Showing top {models.length} problematic vehicle models
                  {startDate && endDate && ` from ${startDate} to ${endDate}`}.
                  Total issues tracked:{" "}
                  <strong>
                    {models
                      .reduce((sum, m) => sum + m.totalIssues, 0)
                      .toLocaleString()}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
