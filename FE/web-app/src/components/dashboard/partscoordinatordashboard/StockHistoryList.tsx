"use client";

import { useEffect, useState } from "react";
import inventoryService, {
  StockHistoryItem,
  StockHistoryResponse,
} from "@/services/inventoryService";
import { Loader2, ChevronRight } from "lucide-react";
import apiClient from "@/lib/apiClient";

interface StockItem {
  stockId: string;
  typeComponentId: string;
  quantityInStock: number;
  quantityReserved: number;
  quantityAvailable: number;
  typeComponent: {
    name: string;
    sku: string;
  };
  warehouse: {
    name: string;
  };
}

export default function StockHistoryList({
  warehouseId,
}: {
  warehouseId: string | null;
}) {
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<StockHistoryItem[]>([]);

  // ✅ Pagination đúng chuẩn backend (có itemsPerPage)
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20, // ✅ cần có theo backend
  });

  // ======================================================
  // ✅ Load stocks list when component mounts
  // ======================================================
  useEffect(() => {
    if (!warehouseId) return;
    loadStocks();
  }, [warehouseId]);

  // ======================================================
  // ✅ Load stock history when stockId changes
  // ======================================================
  useEffect(() => {
    if (!selectedStockId) return;
    loadHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStockId]);

  const loadStocks = async () => {
    try {
      setLoadingStocks(true);
      const response = await apiClient.get("/inventory/type-components", {
        params: { limit: 100 },
      });

      const typeComponents =
        response.data.data.components?.typeComponents ?? [];
      setStocks(typeComponents);
    } catch (err) {
      console.error("Error loading stocks:", err);
      setStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const loadHistory = async (page: number) => {
    if (!selectedStockId) return;

    try {
      setLoading(true);

      const data: StockHistoryResponse = await inventoryService.getStockHistory(
        selectedStockId,
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
  // ✅ Safe UI if no warehouse
  // ======================================================
  if (!warehouseId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow text-gray-500">
        No warehouse selected.
      </div>
    );
  }

  // ======================================================
  // ✅ STOCK SELECTION VIEW
  // ======================================================
  if (!selectedStockId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Select a Stock Item
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Choose a stock item to view its adjustment history
        </p>

        {loadingStocks ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : stocks.length === 0 ? (
          <p className="text-gray-500">No stock items found.</p>
        ) : (
          <div className="space-y-2">
            {stocks.map((stock) => (
              <button
                key={stock.stockId}
                onClick={() => setSelectedStockId(stock.stockId)}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {stock.typeComponent.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      SKU: {stock.typeComponent.sku} • {stock.warehouse.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Available:{" "}
                      <span className="font-semibold text-green-600">
                        {stock.quantityAvailable}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      In Stock: {stock.quantityInStock} • Reserved:{" "}
                      {stock.quantityReserved}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ======================================================
  // ✅ HISTORY VIEW
  // ======================================================
  const selectedStock = stocks.find((s) => s.stockId === selectedStockId);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stock History</h2>
          {selectedStock && (
            <p className="text-sm text-gray-500 mt-1">
              {selectedStock.typeComponent.name} (
              {selectedStock.typeComponent.sku})
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedStockId(null);
            setHistory([]);
          }}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          ← Back to Stock List
        </button>
      </div>

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
export { StockHistoryList };
