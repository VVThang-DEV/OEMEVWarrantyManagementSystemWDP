"use client";

import { useEffect, useState } from "react";
import inventoryService, {
  StockHistoryItem,
  StockHistoryResponse,
} from "@/services/inventoryService";
import { Loader2 } from "lucide-react";

export default function StockHistoryList({
  stockId,
}: {
  stockId: string | null;
}) {
  const [loading, setLoading] = useState(true);

  const [history, setHistory] = useState<StockHistoryItem[]>([]);

  // ✅ Pagination đúng chuẩn backend (có itemsPerPage)
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20, // ✅ cần có theo backend
  });

  // ======================================================
  // ✅ Load stock history when stockId changes
  // ======================================================
  useEffect(() => {
    if (!stockId) return; // tránh gọi API khi chưa có stockId
    loadHistory(1);
  }, [stockId]);

  const loadHistory = async (page: number) => {
    try {
      setLoading(true);

      const data: StockHistoryResponse = await inventoryService.getStockHistory(
        stockId!,
        page,
        20
      );

      setHistory(data.history ?? []);

      // ✅ backend trả pagination đầy đủ gồm itemsPerPage
      setPagination(
        data.pagination ?? {
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 20,
        }
      );
    } catch (err) {
      console.error("Error loading stock history:", err);

      // fallback pagination
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
  // ✅ Safe UI if no stock selected
  // ======================================================
  if (!stockId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow text-gray-500">
        No stock selected.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Stock History
      </h2>

      {/* ================= LOADING ================= */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-gray-500">No history found.</p>
      ) : (
        <>
          {/* ================= TABLE ================= */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">Event</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>

            <tbody>
              {history.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{item.eventType}</td>
                  <td className="py-2">
                    {item.quantityChange > 0
                      ? `+${item.quantityChange}`
                      : item.quantityChange}
                  </td>
                  <td className="py-2">
                    {new Date(item.eventDate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ================= PAGINATION ================= */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={pagination.currentPage <= 1}
              onClick={() => loadHistory(pagination.currentPage - 1)}
              className="px-4 py-2 rounded bg-gray-200 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} / {pagination.totalPages}
            </span>

            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => loadHistory(pagination.currentPage + 1)}
              className="px-4 py-2 rounded bg-gray-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
