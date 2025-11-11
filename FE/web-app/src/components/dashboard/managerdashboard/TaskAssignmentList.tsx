"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import taskAssignmentService, {
  TaskAssignment,
} from "@/services/taskAssignmentService";
import {
  Loader2,
  ClipboardList,
  User,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function TaskAssignmentList() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  useEffect(() => {
    loadTasks(1, statusFilter);
  }, [statusFilter]);

  const loadTasks = async (page: number, status?: string) => {
    try {
      setLoading(true);

      const result = await taskAssignmentService.getTaskAssignments({
        page,
        limit: 20,
        status: status || undefined,
      });

      setTasks(result.tasks || []);
      if (result.pagination) {
        setPagination({
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages,
        });
      }
    } catch (err) {
      console.error("Error fetching task assignments:", err);
      const errorObj = err as { response?: { data?: { message?: string } } };

      // Handle backend schema mismatch gracefully
      if (errorObj.response?.data?.message?.includes("Unknown column")) {
        setError(
          "Database configuration issue detected. The backend needs to be updated to use 'vehicleModelId' instead of 'modelId' in the Vehicle table query."
        );
      } else {
        setError(
          errorObj.response?.data?.message || "Failed to load task assignments"
        );
      }

      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
      COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
    };

    const style = styles[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Task Assignments
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor technician task assignments and track progress
          </p>
        </div>

        {/* Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="w-5 h-5" />
              <span className="font-semibold text-gray-900">Filters</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                className="border border-gray-300 text-black rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Tasks List Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm"
        >
          {error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Error Loading Tasks
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    loadTasks(1, statusFilter);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No task assignments found</p>
              <p className="text-sm mt-1">
                {statusFilter
                  ? `No tasks with status "${statusFilter}"`
                  : "No active task assignments"}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Status and Completion */}
                        <div className="flex items-center gap-3 mb-4">
                          {getStatusBadge(task.status)}
                          {task.completedAt && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          {/* Technician Info */}
                          {task.technician && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Assigned Technician
                              </p>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {task.technician.name}
                                  </p>
                                  {task.technician.phone && (
                                    <p className="text-xs text-gray-500">
                                      {task.technician.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Assigned Date */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Assigned At
                            </p>
                            <p className="text-sm text-gray-900">
                              {new Date(task.assignedAt).toLocaleString()}
                            </p>
                          </div>

                          {/* Completed Date */}
                          {task.completedAt && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Completed At
                              </p>
                              <p className="text-sm text-gray-900">
                                {new Date(task.completedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Case Line Details */}
                        {task.caseLine && (
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-purple-700 mb-1">
                                  Diagnosis
                                </p>
                                <p className="text-sm text-purple-900">
                                  {task.caseLine.diagnosisText ||
                                    "No diagnosis provided"}
                                </p>
                              </div>

                              {task.caseLine.correctionText && (
                                <div>
                                  <p className="text-xs font-medium text-purple-700 mb-1">
                                    Correction
                                  </p>
                                  <p className="text-sm text-purple-900">
                                    {task.caseLine.correctionText}
                                  </p>
                                </div>
                              )}

                              {task.caseLine.guaranteeCase
                                ?.vehicleProcessingRecord && (
                                <div>
                                  <p className="text-xs font-medium text-purple-700 mb-1">
                                    Vehicle
                                  </p>
                                  <p className="text-sm text-purple-900 font-mono">
                                    VIN:{" "}
                                    {
                                      task.caseLine.guaranteeCase
                                        .vehicleProcessingRecord.vin
                                    }
                                  </p>
                                  {task.caseLine.guaranteeCase
                                    .vehicleProcessingRecord.customerName && (
                                    <p className="text-xs text-purple-700">
                                      Customer:{" "}
                                      {
                                        task.caseLine.guaranteeCase
                                          .vehicleProcessingRecord.customerName
                                      }
                                    </p>
                                  )}
                                </div>
                              )}

                              <div>
                                <p className="text-xs font-medium text-purple-700 mb-1">
                                  Case Line Status
                                </p>
                                <p className="text-sm text-purple-900">
                                  {task.caseLine.status}
                                  {task.caseLine.warrantyStatus && (
                                    <span
                                      className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                        task.caseLine.warrantyStatus ===
                                        "ELIGIBLE"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {task.caseLine.warrantyStatus}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* PAGINATION */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing page {pagination.page} of {pagination.totalPages} (
                    {pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        loadTasks(pagination.page - 1, statusFilter)
                      }
                      disabled={pagination.page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        loadTasks(pagination.page + 1, statusFilter)
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
