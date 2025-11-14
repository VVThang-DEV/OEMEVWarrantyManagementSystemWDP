"use client";

import React, { useState } from "react";
import stockTransferService from "@/services/stockTransferService";

interface ComponentItem {
  id: string;
  name: string;
  code: string; // code = sku
  quantity: number;
}

interface RestockItem {
  typeComponentId: string;
  sku: string;
  quantityRequested: number;
}

type ItemField = "typeComponentId" | "sku" | "quantityRequested";

interface RestockRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: ComponentItem[];
  warehouseId: string;
  warehouseName: string;
}

export default function RestockRequestModal({
  isOpen,
  onClose,
  components,
  warehouseId,
  warehouseName,
}: RestockRequestModalProps) {
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<RestockItem[]>([
    { typeComponentId: "", sku: "", quantityRequested: 1 },
  ]);

  const updateItemField = (
    index: number,
    field: ItemField,
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // ❗ CHỈ GỬI sku + quantityRequested — KHÔNG GỬI typeComponentId
      const payloadItems = items.map(({ sku, quantityRequested }) => ({
        sku,
        quantityRequested,
      }));

      await stockTransferService.createWarehouseRestock({
        requestingWarehouseId: warehouseId,
        items: payloadItems,
      });

      onClose();
    } catch (error) {
      console.error("❌ Error creating restock request:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl p-6 space-y-5 shadow-lg">
        <h2 className="text-xl font-semibold text-black">
          Create Restock Request
        </h2>

        <p className="text-sm text-gray-700">Request will be created for:</p>

        <div className="px-4 py-2 bg-gray-100 rounded-lg">
          <p className="text-black font-semibold">{warehouseName}</p>
          <p className="text-xs text-gray-500">Warehouse ID: {warehouseId}</p>
        </div>

        {/* Items */}
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-2 gap-3">
            {/* Component dropdown */}
            <select
              value={item.typeComponentId}
              onChange={(e) => {
                const id = e.target.value;
                const selected = components.find((c) => c.id === id);

                updateItemField(index, "typeComponentId", id);
                // auto-fill sku từ code
                updateItemField(index, "sku", selected?.code || "");
              }}
              className="px-3 py-2 border rounded-lg text-black"
            >
              <option value="">Select component...</option>

              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            {/* Quantity */}
            <input
              type="number"
              min={1}
              placeholder="Qty"
              value={item.quantityRequested}
              onChange={(e) =>
                updateItemField(
                  index,
                  "quantityRequested",
                  Number(e.target.value)
                )
              }
              className="px-3 py-2 border rounded-lg text-black"
            />
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-black hover:bg-gray-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {loading ? "Submitting..." : "Create Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
