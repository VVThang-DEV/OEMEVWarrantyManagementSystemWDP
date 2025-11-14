"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Home,
  Package,
  Settings,
  Boxes,
  Clock1,
  Truck,
  RotateCcw,
} from "lucide-react";
import { authService } from "@/services";
import { useRoleProtection } from "@/hooks/useRoleProtection";

import {
  Sidebar,
  DashboardHeader,
  PartsCoordinatorDashboardOverview,
  ComponentStatusManager,
} from "@/components/dashboard";

import Inventory from "@/components/dashboard/partscoordinatordashboard/Inventory";
import { InventoryDashboard } from "@/components/inventory";
import AllocateComponentModal from "@/components/dashboard/partscoordinatordashboard/AllocationModal";
import TransferComponentModal from "@/components/dashboard/partscoordinatordashboard/TransferModal";
import { ComponentReturnList } from "@/components/dashboard/partscoordinatordashboard/ComponentReturnList";
import { StockHistoryList } from "@/components/dashboard/partscoordinatordashboard/StockHistoryList";
import { AdjustmentList } from "@/components/dashboard/partscoordinatordashboard/AdjustmentList";
import { CreateAdjustmentModal } from "@/components/dashboard/partscoordinatordashboard/CreateAdjustmentModal";
import ComponentReservationQueue from "@/components/dashboard/partscoordinatordashboard/ComponentReservationQueue";
import { ComponentPickupList } from "@/components/dashboard/partscoordinatordashboard/ComponentPickupList";
import { StockTransferReceiving } from "@/components/dashboard/partscoordinatordashboard/StockTransferReceiving";

import RestockPage from "@/components/dashboard/partscoordinatordashboard/RestockPage";
import { warehouseService } from "@/services/warehouseService";

interface CurrentUser {
  userId: string;
  username?: string;
  name?: string;
  roleName: string;
  serviceCenterId?: string;
  companyId?: string;
}

export default function PartsCoordinatorDashboard() {
  useRoleProtection([
    "parts_coordinator_service_center",
    "parts_coordinator_company",
  ]);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCreateAdjustment, setShowCreateAdjustment] = useState(false);

  const [warehouseId, setWarehouseId] = useState("");
  const [warehouseName, setWarehouseName] = useState("Warehouse");

  useEffect(() => {
    const userInfo = authService.getUserInfo();
    if (userInfo) setCurrentUser(userInfo);
    else setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    async function loadWarehouse() {
      try {
        const data = await warehouseService.getWarehouseInfo();
        if (data.warehouses.length > 0) {
          setWarehouseId(data.warehouses[0].warehouseId);
          setWarehouseName(data.warehouses[0].name);
        }
      } catch (err) {
        console.error("Failed to load warehouse info:", err);
      }
    }

    loadWarehouse();
  }, []);

  const handleLogout = () => authService.logout();

  const isServiceCenterCoordinator =
    currentUser?.roleName === "parts_coordinator_service_center";

  const baseNavItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "inventory", icon: Boxes, label: "Inventory" },
    { id: "restock", icon: Package, label: "Restock Requests" },
    { id: "adjustments", icon: Clock1, label: "Adjustments" },
    { id: "stock-history", icon: Clock1, label: "Stock History" },
    { id: "reservations", icon: Package, label: "Reservations" },
    { id: "pickups", icon: Package, label: "Component Pickups" },
  ];

  const navItems = isServiceCenterCoordinator
    ? [
        ...baseNavItems,
        { id: "receiving", icon: Truck, label: "Receive Shipments" },
        { id: "status", icon: Settings, label: "Component Status" },
      ]
    : [
        ...baseNavItems,
        { id: "status", icon: Settings, label: "Component Status" },
      ];

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return <PartsCoordinatorDashboardOverview />;

      case "inventory": {
        const isCompanyCoordinator =
          currentUser?.roleName === "parts_coordinator_company";

        return (
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              {isCompanyCoordinator ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-6 shadow-lg">
                    <InventoryDashboard
                      onOpenAllocate={() => setShowAllocateModal(true)}
                      onOpenTransfer={() => setShowTransferModal(true)}
                    />
                  </div>

                  <AllocateComponentModal
                    isOpen={showAllocateModal}
                    onClose={() => setShowAllocateModal(false)}
                  />

                  <TransferComponentModal
                    isOpen={showTransferModal}
                    onClose={() => setShowTransferModal(false)}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
                  <Inventory />
                </div>
              )}
            </div>
          </div>
        );
      }

      case "restock":
        return (
          <RestockPage
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        );

      case "stock-history":
        return <StockHistoryList warehouseId={warehouseId} />;

      case "adjustments":
        return (
          <>
            <AdjustmentList
              onCreateClick={() => setShowCreateAdjustment(true)}
            />

            <CreateAdjustmentModal
              isOpen={showCreateAdjustment}
              onClose={() => setShowCreateAdjustment(false)}
              warehouseId={warehouseId}
            />
          </>
        );

      case "reservations":
        return <ComponentReservationQueue />;

      case "pickups":
        return (
          <ComponentPickupList serviceCenterId={currentUser?.serviceCenterId} />
        );

      case "receiving":
        if (!isServiceCenterCoordinator) {
          return (
            <div className="flex-1 overflow-auto">
              <div className="p-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <p className="text-yellow-800">
                    This feature is only available for Service Center Parts
                    Coordinators.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <StockTransferReceiving />
            </div>
          </div>
        );

      case "component-returns":
        return (
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-purple-600" />
                    Components to Return
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Installed components with old parts ready to be returned
                  </p>
                </div>
                <div className="p-6">
                  <ComponentReturnList />
                </div>
              </div>
            </div>
          </div>
        );

      case "status":
        return <ComponentStatusManager />;

      default:
        return <PartsCoordinatorDashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        navItems={navItems}
        brandIcon={Package}
        brandName="Parts"
        brandSubtitle="Coordinator"
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onSearch={setSearchQuery}
          onNavigate={setActiveNav}
          searchPlaceholder="Search components..."
          showSearch={false}
          showNotifications={true}
          currentPage={
            activeNav === "dashboard"
              ? undefined
              : navItems.find((i) => i.id === activeNav)?.label
          }
          searchValue={searchQuery}
        />

        {renderContent()}
      </div>
    </div>
  );
}
