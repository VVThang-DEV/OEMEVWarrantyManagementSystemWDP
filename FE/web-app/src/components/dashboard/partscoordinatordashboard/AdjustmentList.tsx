"use client";

import { useEffect, useState } from "react";
import inventoryService, {
  InventoryAdjustmentDetail,
  InventoryAdjustmentSummary,
} from "@/services/inventoryService";
import { Loader2, Search, Eye } from "lucide-react";

export default function AdjustmentList() {
  const [loading, setLoading] = useState(true);

  // ✅ LIST ADJUSTMENTS
  const [adjustments, setAdjustments] = useState<InventoryAdjustmentSummary[]>(
    []
  );

  // ✅ Pagination
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20,
  });

  // ✅ DETAIL STATE
  const [selectedAdjustment, setSelectedAdjustment] =
    useState<InventoryAdjustmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadAdjustments(1);
  }, []);

  // ======================================================
  // ✅ LOAD LIST
  // ======================================================
  const loadAdjustments = async (page: number) => {
    try {
      setLoading(true);

      const result = await inventoryService.getAdjustmentList({ page });

      setAdjustments(result.items ?? []);

      setPagination({
        totalItems: result.pagination?.totalItems ?? 0,
        totalPages: result.pagination?.totalPages ?? 1,
        currentPage: result.pagination?.currentPage ?? 1,
        itemsPerPage: result.pagination?.itemsPerPage ?? 20,
      });
    } catch (err) {
      console.error("Error fetching adjustments:", err);

      setAdjustments([]);
      setPagination({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 20,
      });
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // ✅ LOAD DETAIL
  // ======================================================
  const openDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);

      const detail = await inventoryService.getAdjustmentById(id);
      setSelectedAdjustment(detail);
    } catch (err) {
      console.error("Error fetching adjustment detail:", err);
      setSelectedAdjustment(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedAdjustment(null);
  };

  return (
    <div className="space-y-6">
      {/* =================== LIST CARD =================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Adjustment History
          </h2>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-black" />
            <input
              placeholder="Search..."
              className="
                pl-10 pr-4 py-2 
                w-full 
                rounded-xl 
                border border-black 
                bg-white 
                text-black
                placeholder:text-gray-700
                focus:ring-2 focus:ring-black/40
                transition
              "
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : adjustments.length === 0 ? (
          <div className="text-gray-500 text-center py-6">
            No adjustments found.
          </div>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-3">ID</th>
                  <th className="py-3">Warehouse</th>
                  <th className="py-3">Reason</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Created At</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {adjustments.map((a) => (
                  <tr
                    key={a.adjustmentId}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3">{a.adjustmentId}</td>
                    <td className="py-3">{a.warehouseId}</td>
                    <td className="py-3">{a.reason}</td>
                    <td className="py-3">{a.adjustmentType}</td>
                    <td className="py-3">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 text-center">
                      <button
                        onClick={() => openDetail(a.adjustmentId)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ✅ Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                disabled={pagination.currentPage <= 1}
                onClick={() => loadAdjustments(pagination.currentPage - 1)}
                className="px-4 py-2 rounded bg-gray-200 disabled:opacity-40"
              >
                Prev
              </button>

              <span className="text-gray-600">
                Page {pagination.currentPage} / {pagination.totalPages}
              </span>

              <button
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => loadAdjustments(pagination.currentPage + 1)}
                className="px-4 py-2 rounded bg-gray-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* =================== DETAIL MODAL =================== */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
            {detailLoading || !selectedAdjustment ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-4">
                  Adjustment Detail
                </h3>

                <div className="space-y-2 mb-6">
                  <p>
                    <strong>ID:</strong> {selectedAdjustment.adjustmentId}
                  </p>
                  <p>
                    <strong>Warehouse:</strong> {selectedAdjustment.warehouseId}
                  </p>
                  <p>
                    <strong>Adjusted By:</strong>{" "}
                    {selectedAdjustment.adjustedBy?.name}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedAdjustment.adjustmentType}
                  </p>
                  <p>
                    <strong>Reason:</strong> {selectedAdjustment.reason}
                  </p>
                  <p>
                    <strong>Note:</strong> {selectedAdjustment.note || "—"}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedAdjustment.createdAt).toLocaleString()}
                  </p>
                </div>

                <h4 className="font-semibold mb-2">Affected Items</h4>
                <div className="max-h-64 overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-gray-600">
                        <th className="py-2">Serial</th>
                        <th className="py-2">Old Status</th>
                        <th className="py-2">New Status</th>
                        <th className="py-2">Δ</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedAdjustment.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{item.serialNumber}</td>
                          <td className="py-2">{item.oldStatus}</td>
                          <td className="py-2">{item.newStatus}</td>
                          <td className="py-2">
                            {item.delta > 0 ? `+${item.delta}` : item.delta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={closeDetail}
                  className="mt-6 w-full py-2 bg-gray-800 text-white rounded-lg"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
