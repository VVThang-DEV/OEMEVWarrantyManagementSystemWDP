"use client";

import { CheckCircle, AlertCircle, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import caseLineService from "@/services/caseLineService";
import { motion, AnimatePresence } from "framer-motion";

interface MarkRepairCompleteButtonProps {
  caseLineId: string;
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
  showNextSteps?: boolean; // Show next action suggestions
  pendingRepairsCount?: number; // Number of other pending repairs
}

export function MarkRepairCompleteButton({
  caseLineId,
  onSuccess,
  disabled = false,
  className = "",
  showNextSteps = false,
  pendingRepairsCount = 0,
}: MarkRepairCompleteButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmComplete = async () => {
    setShowConfirmModal(false);
    setError(null);
    setIsSubmitting(true);

    try {
      await caseLineService.markRepairComplete(caseLineId);

      if (showNextSteps && pendingRepairsCount > 0) {
        setShowSuccess(true);
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          onSuccess?.();
        }, 3000);
      } else {
        onSuccess?.();
      }
    } catch (err: unknown) {
      console.error("Failed to mark repair as complete:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || "Failed to mark repair as complete"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleOpenModal}
        disabled={disabled || isSubmitting}
        className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <CheckCircle className="w-4 h-4" />
        {isSubmitting ? "Marking..." : "Mark Complete"}
      </button>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {showSuccess && pendingRepairsCount > 0 && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              Repair marked complete!
            </p>
            <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
              {pendingRepairsCount} more repair
              {pendingRepairsCount !== 1 ? "s" : ""} pending
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Confirm Completion
                  </h2>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    This will mark the repair as complete. Make sure the
                    component has been installed and all repair work is
                    finished.
                  </p>
                </div>

                <p className="text-sm text-gray-700">
                  Are you sure you want to mark this repair as complete?
                </p>

                {pendingRepairsCount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      You have {pendingRepairsCount} more repair
                      {pendingRepairsCount !== 1 ? "s" : ""} waiting to be
                      completed.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
