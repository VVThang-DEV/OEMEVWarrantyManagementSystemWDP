"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Loader2,
  Car,
  Calendar,
  Gauge,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Wrench,
  Package,
  XCircle,
  Info,
} from "lucide-react";
import publicService, { TrackingInfo } from "@/services/publicService";

export default function TrackPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [token, setToken] = useState(tokenFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      handleSearch(tokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  const handleSearch = async (searchToken?: string) => {
    const targetToken = searchToken || token;

    if (!targetToken || targetToken.trim() === "") {
      setError("Please enter a tracking token");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTrackingInfo(null);

      const response = await publicService.getTrackingInfo(targetToken.trim());

      setTrackingInfo(response.data);
    } catch (err: unknown) {
      console.error("Error fetching tracking info:", err);
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };

      if (error.response?.status === 404) {
        setError(
          "No service record found for this tracking token. Please check the token and try again."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to fetch tracking information. Please try again later."
        );
      }
      setTrackingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CHECKED_IN: "bg-blue-100 text-blue-700 border-blue-300",
      IN_DIAGNOSIS: "bg-yellow-100 text-yellow-700 border-yellow-300",
      WAITING_CUSTOMER_APPROVAL:
        "bg-orange-100 text-orange-700 border-orange-300",
      PROCESSING: "bg-purple-100 text-purple-700 border-purple-300",
      READY_FOR_PICKUP: "bg-green-100 text-green-700 border-green-300",
      COMPLETED: "bg-gray-100 text-gray-700 border-gray-300",
      CANCELLED: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return <Clock className="w-5 h-5" />;
      case "IN_DIAGNOSIS":
        return <Search className="w-5 h-5" />;
      case "WAITING_CUSTOMER_APPROVAL":
        return <AlertCircle className="w-5 h-5" />;
      case "PROCESSING":
        return <Wrench className="w-5 h-5" />;
      case "READY_FOR_PICKUP":
        return <CheckCircle className="w-5 h-5" />;
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5" />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Track Your Vehicle Service
            </h1>
          </div>
          <p className="text-gray-600">
            Enter your tracking token to check the status of your vehicle
            service
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Enter your tracking token (UUID format)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Track
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Tracking Results */}
        {trackingInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Service Status
                  </h2>
                  <p className="text-gray-600">
                    VIN:{" "}
                    <span className="font-mono font-semibold">
                      {trackingInfo.vin}
                    </span>
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold ${getStatusColor(
                    trackingInfo.status
                  )}`}
                >
                  {getStatusIcon(trackingInfo.status)}
                  {formatStatus(trackingInfo.status)}
                </div>
              </div>

              {/* Vehicle & Service Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-gray-600" />
                    <p className="text-sm font-medium text-gray-600">Vehicle</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {trackingInfo.vehicle?.model?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {trackingInfo.vehicle?.model?.company?.name || ""}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-5 h-5 text-gray-600" />
                    <p className="text-sm font-medium text-gray-600">
                      Odometer
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {trackingInfo.odometer.toLocaleString()} km
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <p className="text-sm font-medium text-gray-600">
                      Check-in Date
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(trackingInfo.checkInDate).toLocaleString()}
                  </p>
                </div>

                {trackingInfo.checkOutDate && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <p className="text-sm font-medium text-gray-600">
                        Check-out Date
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {new Date(trackingInfo.checkOutDate).toLocaleString()}
                    </p>
                  </div>
                )}

                {trackingInfo.mainTechnician && (
                  <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-gray-600" />
                      <p className="text-sm font-medium text-gray-600">
                        Assigned Technician
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {trackingInfo.mainTechnician.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Guarantee Cases */}
            {trackingInfo.guaranteeCases &&
              trackingInfo.guaranteeCases.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Service Cases
                  </h3>
                  <div className="space-y-4">
                    {trackingInfo.guaranteeCases.map((guaranteeCase) => (
                      <div
                        key={guaranteeCase.guaranteeCaseId}
                        className="p-4 border border-gray-200 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">
                              {guaranteeCase.contentGuarantee}
                            </p>
                            <span
                              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                guaranteeCase.status
                              )}`}
                            >
                              {formatStatus(guaranteeCase.status)}
                            </span>
                          </div>
                        </div>

                        {/* Case Lines */}
                        {guaranteeCase.caseLines &&
                          guaranteeCase.caseLines.length > 0 && (
                            <div className="mt-4 space-y-3">
                              <p className="text-sm font-medium text-gray-600">
                                Service Items:
                              </p>
                              {guaranteeCase.caseLines.map((caseLine) => (
                                <div
                                  key={caseLine.id}
                                  className="p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-start gap-3">
                                    <Package className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                      {caseLine.typeComponent && (
                                        <p className="font-medium text-gray-900 mb-1">
                                          {caseLine.typeComponent.name}
                                        </p>
                                      )}
                                      {caseLine.diagnosisText && (
                                        <p className="text-sm text-gray-600">
                                          <span className="font-medium">
                                            Diagnosis:
                                          </span>{" "}
                                          {caseLine.diagnosisText}
                                        </p>
                                      )}
                                      {caseLine.correctionText && (
                                        <p className="text-sm text-gray-600">
                                          <span className="font-medium">
                                            Correction:
                                          </span>{" "}
                                          {caseLine.correctionText}
                                        </p>
                                      )}
                                      {caseLine.warrantyStatus && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Warranty: {caseLine.warrantyStatus}
                                        </p>
                                      )}
                                      {caseLine.status && (
                                        <span
                                          className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                            caseLine.status
                                          )}`}
                                        >
                                          {formatStatus(caseLine.status)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </motion.div>
        )}

        {/* Info Card */}
        {!trackingInfo && !error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">How to use:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Check your email for the tracking link sent when your
                    vehicle was checked in
                  </li>
                  <li>
                    Enter the tracking token from the email or URL in the search
                    box above
                  </li>
                  <li>
                    Click &ldquo;Track&rdquo; to view the current status of your
                    vehicle service
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
