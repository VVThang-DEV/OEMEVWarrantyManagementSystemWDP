"use client";

import { useState, useEffect } from "react";
import { Home, Package, Settings, Boxes } from "lucide-react";
import { authService } from "@/services";
import { useRoleProtection } from "@/hooks/useRoleProtection";

import {
  Sidebar,
  DashboardHeader,
  PartsCoordinatorDashboardOverview,
  ComponentPickupList,
  ComponentStatusManager,
} from "@/components/dashboard";

import Inventory from "@/components/dashboard/partscoordinatordashboard/Inventory";
import { InventoryDashboard } from "@/components/inventory";
import AllocateComponentModal from "@/components/dashboard/partscoordinatordashboard/AllocationModal";
import TransferComponentModal from "@/components/dashboard/partscoordinatordashboard/TransferModal";
import { ComponentReturnList } from "@/components/dashboard/partscoordinatordashboard/ComponentReturnList";

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

  // ====================== NAV ITEMS ==========================
  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "inventory", icon: Boxes, label: "Inventory" },
    { id: "adjustments", icon: Clock, label: "Adjustments" },
    { id: "stock-history", icon: Clock, label: "Stock History" },
    { id: "pickups", icon: Package, label: "Component Pickups" },
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
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Boxes className="w-6 h-6 text-blue-600" />
                      Service Center Inventory
                    </h2>

                    <p className="text-gray-600 text-sm mt-1">
                      Manage components for your service center
                    </p>
                  </div>

                  <Inventory />
                </div>
              )}
            </div>
          </div>
        );

      // ✅ STOCK HISTORY
      case "stock-history":
        return (
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Stock History
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  View all stock ledger events for components
                </p>
              </div>

              <div className="mt-6">
                <StockHistoryList stockId={warehouseId} />
              </div>
            </div>
          </div>
        );

      // ✅ ADJUSTMENTS PAGE — FIXED
      case "adjustments":
        return (
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Inventory Adjustments
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    View and manage manual inventory adjustments
                  </p>
                </div>

                {/* ✅ BUTTON OPEN POPUP */}
                <button
                  onClick={() => setShowCreateAdjustment(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                >
                  + Create Adjustment
                </button>
              </div>

              <div className="mt-6">
                <AdjustmentList />
              </div>
            </div>

            {/* ✅ POPUP CHỈ HIỆN KHI Ở TAB NÀY  */}
            <CreateAdjustmentModal
              isOpen={showCreateAdjustment}
              onClose={() => setShowCreateAdjustment(false)}
              warehouseId={warehouseId} // ✅ FIXED REQUIRED PROP
            />
          </div>
        );

      // ✅ PICKUPS
      case "pickups":
        return (
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Reserved Components Ready for Pickup
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Components waiting to be picked up from warehouse
                  </p>
                </div>

                <div className="p-6">
                  <ComponentPickupList />
                </div>
              </div>
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
