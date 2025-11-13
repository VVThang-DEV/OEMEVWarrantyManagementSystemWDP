"use client";

import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import caseLineService from "@/services/caseLineService";

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

  const handleMarkComplete = async () => {
    if (!confirm("Mark this repair as complete?")) {
      return;
    }

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
        onClick={handleMarkComplete}
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
    </div>
  );
}
