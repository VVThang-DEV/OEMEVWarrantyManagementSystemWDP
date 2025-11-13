"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Home, Package, Settings, Boxes, Clock1, Truck } from "lucide-react";
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
import { RotateCcw } from "lucide-react";
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

  // ✅ popup create adjustment
  const [showCreateAdjustment, setShowCreateAdjustment] = useState(false);

  useEffect(() => {
    const userInfo = authService.getUserInfo();
    if (userInfo) setCurrentUser(userInfo);
    else setCurrentUser(authService.getCurrentUser());
  }, []);

  const handleLogout = () => authService.logout();

  // ✅ Lấy warehouseId để truyền vào popup
  const warehouseId =
    currentUser?.serviceCenterId || currentUser?.companyId || "";

  const isServiceCenterCoordinator =
    currentUser?.roleName === "parts_coordinator_service_center";

  // ====================== NAV ITEMS ==========================
  const baseNavItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "inventory", icon: Boxes, label: "Inventory" },
    { id: "adjustments", icon: Clock1, label: "Adjustments" },
    { id: "stock-history", icon: Clock1, label: "Stock History" },
    { id: "reservations", icon: Package, label: "Reservations" },
    { id: "pickups", icon: Package, label: "Component Pickups" },
  ];

  // Add "Receive Shipments" only for Service Center Parts Coordinators
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

  // ==================== PAGE RENDER ==========================
  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return <PartsCoordinatorDashboardOverview />;

      case "inventory":
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

      // ✅ STOCK HISTORY
      case "stock-history":
        return <StockHistoryList warehouseId={warehouseId} />;

      // ✅ ADJUSTMENTS PAGE
      case "adjustments":
        return (
          <>
            <AdjustmentList
              onCreateClick={() => setShowCreateAdjustment(true)}
            />

            {/* ✅ POPUP */}
            <CreateAdjustmentModal
              isOpen={showCreateAdjustment}
              onClose={() => setShowCreateAdjustment(false)}
              warehouseId={warehouseId}
            />
          </>
        );

      // ✅ RESERVATIONS
      case "reservations":
        return <ComponentReservationQueue />;

      // ✅ PICKUPS
      case "pickups":
        return (
          <ComponentPickupList serviceCenterId={currentUser?.serviceCenterId} />
        );

      // ✅ RECEIVE SHIPMENTS (Only for Service Center Parts Coordinators)
      case "receiving":
        // Only show for Service Center Parts Coordinators
        if (currentUser?.roleName !== "parts_coordinator_service_center") {
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
                    Installed components with old parts ready to be returned to
                    warehouse
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

  // ==================== MAIN LAYOUT ==========================
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
