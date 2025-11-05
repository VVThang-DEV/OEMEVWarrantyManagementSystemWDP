# API Endpoint Changes Analysis
## Commit: 7b487e0701f52030bd60949f641790d5b3b835f1

**Analysis Date:** November 5, 2025  
**Purpose:** Identify new/changed/removed endpoints and their impact on frontend

---

## 🚨 CRITICAL ISSUES - Frontend Breaking Changes

### 1. **DELETED ENDPOINT - Component Return**
**Status:** ❌ **BREAKING CHANGE**

**Backend:**
```
DELETED: PATCH /component-reservations/{reservationId}/return
```
- Removed from `componentReservations.router.js` (lines 308-404 deleted)
- Validator `returnReservedComponentSchema` removed
- Controller method `returnReservedComponent` removed

**Frontend Still Using:**
```typescript
// File: FE/web-app/src/services/componentReservationService.ts (lines 249-271)
async returnComponent(
  reservationId: string,
  serialNumber: string
): Promise<ReturnComponentResponse> {
  const response = await apiClient.patch(
    `/reservations/${reservationId}/return`,  // ❌ THIS ENDPOINT NO LONGER EXISTS
    { serialNumber }
  );
  return response.data;
}
```

**Impact:**
- ⚠️ **Parts Coordinator dashboard** - Component return functionality will fail
- ⚠️ Any UI calling `returnComponent()` will get 404 errors
- ⚠️ Workflow for returning old components after installation is BROKEN

**Fix Required:**
- Remove `returnComponent()` from frontend service OR
- Restore backend endpoint OR
- Implement alternative workflow for component returns

---

### 2. **DELETED ENDPOINTS - Warehouse Components**
**Status:** ❌ **BREAKING CHANGE**

**Backend:**
```
DELETED: GET /warehouses/{warehouseId}/components
DELETED: Aggregated components endpoint functionality
```

**Frontend Still Using:**
```typescript
// File: FE/web-app/src/services/warehouseService.ts
export const getWarehouseComponents = async (
  warehouseId: string,
  status?: "ALL" | "IN_WAREHOUSE" | "RESERVED" | "ALLOCATED"
): Promise<ComponentsResponse> {
  const response = await apiClient.get<{
    status: string;
    data: ComponentsResponse;
  }>(`/warehouses/${warehouseId}/components`, {  // ❌ ENDPOINT DELETED
    params: { status },
  });
  return response.data.data;
};

export const getComponents = async (params?: {
  search?: string;
  category?: string;
}): Promise<Component[]> {
  // This aggregates from multiple warehouses
  // Logic depends on warehouse API structure
};
```

**Components Using These Services:**
1. `FE/web-app/src/components/inventory/BatchAllocationModal.tsx` (line 68)
   - `warehouseService.getComponents()`
2. `FE/web-app/src/components/dashboard/partscoordinatordashboard/TransferModal.tsx` (line 51)
   - `.getComponents()`
3. `FE/web-app/src/components/dashboard/partscoordinatordashboard/Inventory.tsx` (line 40)
   - `warehouseService.getComponents()`
4. `FE/web-app/src/components/dashboard/partscoordinatordashboard/AllocationModal.tsx` (line 44)
   - `.getComponents()`

**BUT WAIT:** These components were DELETED in this commit!
- ✅ `BatchAllocationModal.tsx` - DELETED
- ✅ `TransferModal.tsx` - DELETED
- ✅ `Inventory.tsx` - DELETED
- ✅ `AllocationModal.tsx` - DELETED

**Status:** ✅ **Partially Safe** - The components using these endpoints were also deleted, BUT the service methods still exist in `warehouseService.ts`

**Remaining Risk:**
- If any other code references `getWarehouseComponents()` or `getComponents()`, it will break
- Service file still exports these functions (lines 118-263)

---

### 3. **REMOVED OTP VERIFICATION**
**Status:** ⚠️ **BEHAVIOR CHANGE**

**Backend:**
```diff
// caseLine.router.js - Line 699
router.patch(
  "/:caselineId/approve",
  authentication,
  authorizationByRole(["service_center_staff"]),
  validate(approveCaselineBodySchema, "body"),
- ensureOtpVerified,  // ❌ REMOVED
  async (req, res, next) => {
```

**Impact:**
- Staff can now approve case lines WITHOUT OTP verification
- This was likely a security measure that's been removed
- Frontend may still show OTP input fields that are no longer required

**Risk Level:** MEDIUM - Security/business logic change

---

## ✅ NEW ENDPOINTS - Backend Added

### 1. **Inventory Adjustments - Enhanced**
**Status:** ✅ **NEW/ENHANCED**

#### GET /inventory/adjustments
**New endpoint for listing adjustment history**
```
GET /inventory/adjustments
Query params:
  - warehouseId: string (uuid)
  - typeComponentId: string (uuid)
  - adjustmentType: 'IN' | 'OUT'
  - reason: string
  - adjustedByUserId: string (uuid)
  - startDate: string (date)
  - endDate: string (date)
  - page: number (default: 1)
  - limit: number (default: 20)

Roles: parts_coordinator_company, parts_coordinator_service_center

Response: {
  status: "success",
  data: {
    items: InventoryAdjustment[],
    pagination: { currentPage, totalPages, totalItems, itemsPerPage }
  }
}
```

**Frontend Status:** ❌ **NOT IMPLEMENTED**
- No frontend service calls this endpoint
- No UI components use this functionality

---

#### GET /inventory/adjustments/{adjustmentId}
**New endpoint for adjustment details**
```
GET /inventory/adjustments/{adjustmentId}
Roles: parts_coordinator_company, parts_coordinator_service_center

Response: {
  status: "success",
  data: InventoryAdjustment
}
```

**Frontend Status:** ❌ **NOT IMPLEMENTED**

---

#### POST /inventory/adjustments
**Enhanced with new behavior**
```
POST /inventory/adjustments
Body (IN type):
{
  stockId: string (uuid),
  adjustmentType: "IN",
  reason: string,
  note?: string,
  components: [
    { serialNumber: string },
    { serialNumber: string }
  ]
}

Body (OUT type):
{
  stockId: string (uuid),
  adjustmentType: "OUT",
  reason: string,
  quantity: number,
  note?: string
}

Roles: parts_coordinator_company, parts_coordinator_service_center
```

**Changes:**
- Now supports two different schemas based on adjustmentType
- IN type: Must provide array of components with serial numbers
- OUT type: Provide quantity to reduce

**Frontend Status:** ⚠️ **MAY NEED UPDATE**
- Frontend likely still sends old schema format
- Need to verify frontend is sending correct structure

---

### 2. **Stock History Tracking**
**Status:** ✅ **NEW**

#### GET /inventory/stocks/{stockId}/history
```
GET /inventory/stocks/{stockId}/history
Query params:
  - page: number (default: 1)
  - limit: number (default: 20)

Roles: parts_coordinator_company, parts_coordinator_service_center

Response: {
  status: "success",
  data: {
    history: [
      {
        eventType: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'RESERVATION_CREATED' | 
                   'RESERVATION_CANCELLED' | 'INSTALLATION' | 
                   'STOCK_TRANSFER_OUT' | 'STOCK_TRANSFER_IN',
        quantityChange: number,
        eventDate: string (datetime),
        details: object
      }
    ],
    pagination: object
  }
}
```

**Frontend Status:** ❌ **NOT IMPLEMENTED**
- Useful for audit trail and debugging
- Should be added to warehouse/inventory management UI

---

### 3. **Most Used Type Components**
**Status:** ✅ **NEW**

#### GET /inventory/most-used-type-components
```
GET /inventory/most-used-type-components
Query params:
  - limit: number (default: 10)
  - page: number (default: 1)
  - startDate: string (date)
  - endDate: string (date)

Roles: parts_coordinator_company, service_center_manager, 
       evm_staff, parts_coordinator_service_center

Response: {
  status: "success",
  data: {
    components: {
      items: [
        {
          typeComponentId: string,
          typeComponentName: string,
          usageCount: number,
          warehouses: [
            {
              warehouseId: string,
              warehouseName: string,
              quantityUsed: number
            }
          ]
        }
      ],
      pagination: { total, pages, limit, page }
    }
  }
}
```

**Purpose:** Analytics - Track which components are installed most frequently

**Frontend Status:** ❌ **NOT IMPLEMENTED**
- Should be displayed in manager/coordinator dashboards
- Useful for inventory planning and stock optimization

---

### 4. **Warranty Component Management**
**Status:** ✅ **NEW**

#### POST /warranty-components
**Brand new endpoint for warranty component creation**
```
POST /warranty-components
Body: (TBD - check validator)

Roles: parts_coordinator_company
```

**Files:**
- NEW: `BE/src/api/routes/warrantyComponent.router.js`
- NEW: `BE/src/service/warrantyComponent.service.js` (+179 lines)
- NEW: `BE/src/api/controller/warrantyComponent.controller.js` (+29 lines)
- NEW: `BE/src/validators/warrantyComponent.validator.js` (+48 lines)

**Frontend Status:** ❌ **NOT IMPLEMENTED**
- Completely new feature
- No UI exists for this functionality

---

### 5. **Old Component Serial Validation**
**Status:** ✅ **NEW**

#### PATCH /guarantee-cases/{caselineId}/validate-old-component-serial
```
PATCH /guarantee-cases/{caselineId}/validate-old-component-serial
Body:
{
  caseLineId: string (uuid),
  oldComponentSerialNumber: string
}

Roles: service_center_technician

Response: {
  status: "success",
  message: "Old component serial number validated successfully.",
  data: {
    caseLineId: string,
    validationStatus: "VALIDATED"
  }
}
```

**Purpose:** Technician must validate old component serial before installing new one

**Frontend Status:** ❌ **NOT IMPLEMENTED**
- Should be added to technician workflow
- Step between diagnosis and installation

---

## 📝 MODIFIED ENDPOINTS

### 1. **Component Reservations - Get List**
**Status:** ⚠️ **ROLE PERMISSION CHANGED**

```diff
GET /component-reservations
- authorizationByRole(["parts_coordinator_service_center"])
+ authorizationByRole([
+   "parts_coordinator_service_center",
+   "service_center_technician"  // ✅ ADDED
+ ])
```

**Impact:**
- Technicians can now view component reservations
- Frontend may need UI updates to show this to technicians

---

### 2. **Component Reservations - Pickup**
**Status:** ⚠️ **ENDPOINT SIGNATURE CHANGED**

**OLD:**
```
PATCH /reservations/pickup
Body: {
  reservationIds: string[],  // Multiple reservations
  pickedUpByTechId: string
}
```

**NEW:**
```
PATCH /reservations/{reservationId}/pickup
Body: (empty or minimal)
```

**Frontend Service - ALREADY UPDATED:**
```typescript
// FE/web-app/src/services/componentReservationService.ts
async pickupComponent(reservationId: string): Promise<PickupResponse> {
  const response = await apiClient.patch(
    `/reservations/${reservationId}/pickup`  // ✅ ALREADY USING NEW ENDPOINT
  );
  return response.data;
}
```

**Status:** ✅ **Frontend already updated** - No breaking change

---

## 🗑️ DELETED ENDPOINTS SUMMARY

| Endpoint | Method | Impact | Frontend Usage |
|----------|--------|--------|----------------|
| `/component-reservations/{id}/return` | PATCH | ❌ HIGH | Still exists in service |
| `/warehouses/{id}/components` | GET | ⚠️ MEDIUM | Used in deleted components |
| Multiple batch operations | Various | ✅ LOW | Components also deleted |

---

## 📊 FRONTEND SERVICE FILES STATUS

### ✅ Safe (Updated or Not Using Changed Endpoints)
- `authService.ts` - Minor changes, compatible
- `caseLineService.ts` - Using valid endpoints
- `chatService.ts` - Simplified but compatible
- `vehicleService.ts` - Compatible changes
- `workScheduleService.ts` - Compatible

### ⚠️ Needs Review/Update
- `componentReservationService.ts` 
  - ❌ Still exports `returnComponent()` method (line 249-271)
  - ✅ `pickupComponent()` already updated to new endpoint
  
- `warehouseService.ts`
  - ❌ Still exports `getWarehouseComponents()` (line 118-138)
  - ❌ Still exports `getComponents()` (line 140-218)
  - ⚠️ These are unused but exist in the export list

- `stockTransferService.ts`
  - Simplified (-93 lines)
  - Need to verify all endpoints still valid

### ❌ Deleted (Expected)
- `inventoryService.ts` - DELETED (-154 lines)
- `mailService.ts` - DELETED (-93 lines)

---

## 🎯 ACTION ITEMS

### Critical (Must Fix Before Deployment)

1. **Remove or Update Component Return Functionality**
   - [ ] Remove `returnComponent()` from `componentReservationService.ts`
   - [ ] OR restore backend endpoint `/component-reservations/{id}/return`
   - [ ] Update any UI that calls this method
   - [ ] Search codebase: `returnComponent|returnReservedComponent`

2. **Clean Up Warehouse Service**
   - [ ] Remove `getWarehouseComponents()` export
   - [ ] Remove `getComponents()` export
   - [ ] Or implement new backend endpoints if functionality is needed

3. **Update OTP Verification UI**
   - [ ] Remove OTP input from case line approval if it still exists
   - [ ] Update user documentation about approval process

### High Priority (Add New Features)

4. **Implement Inventory Adjustment History UI**
   - [ ] Add service method for `GET /inventory/adjustments`
   - [ ] Add service method for `GET /inventory/adjustments/{id}`
   - [ ] Create UI component to display adjustment history
   - [ ] Add filters (date range, type, reason, etc.)

5. **Implement Stock History Tracking**
   - [ ] Add service method for `GET /inventory/stocks/{stockId}/history`
   - [ ] Add UI to show stock transaction history
   - [ ] Display in warehouse management or stock detail view

6. **Add Most Used Components Analytics**
   - [ ] Add service method for `GET /inventory/most-used-type-components`
   - [ ] Create dashboard widget for managers
   - [ ] Show usage trends and recommendations

7. **Implement Old Component Serial Validation**
   - [ ] Add service method for `PATCH /guarantee-cases/{id}/validate-old-component-serial`
   - [ ] Add validation step in technician workflow UI
   - [ ] Add before component installation process

8. **Implement Warranty Component Management**
   - [ ] Research warranty component feature requirements
   - [ ] Add service method for `POST /warranty-components`
   - [ ] Create UI for parts coordinators to manage warranty components

### Medium Priority (Quality Improvements)

9. **Update Component Reservation UI for Technicians**
   - [ ] Show reservation list to technicians (permission now granted)
   - [ ] Add technician view of their assigned reservations

10. **Verify Inventory Adjustment Schema**
    - [ ] Check if frontend sends correct schema for IN/OUT types
    - [ ] Update form to handle both IN and OUT adjustment types
    - [ ] Add serial number input for IN adjustments
    - [ ] Add quantity input for OUT adjustments

11. **Test All Modified Endpoints**
    - [ ] Test case line approval without OTP
    - [ ] Test component pickup with new endpoint
    - [ ] Verify all authorization role changes work correctly

---

## 🧪 TESTING CHECKLIST

### Regression Testing
- [ ] Component pickup flow (parts coordinator)
- [ ] Component installation flow (technician)
- [ ] Case line approval (staff) - without OTP
- [ ] Inventory summary and details
- [ ] Warehouse stock viewing
- [ ] Stock transfers between warehouses

### Negative Testing (Expected Failures)
- [ ] Call `/component-reservations/{id}/return` → Should get 404
- [ ] Call `/warehouses/{id}/components` → Should get 404
- [ ] Try component return in UI → Should fail gracefully

### New Feature Testing
- [ ] Inventory adjustment creation (IN type with serial numbers)
- [ ] Inventory adjustment creation (OUT type with quantity)
- [ ] View adjustment history with filters
- [ ] View stock transaction history
- [ ] View most used components analytics
- [ ] Validate old component serial (technician)
- [ ] Create warranty component (parts coordinator)

### Permission Testing
- [ ] Technician can view component reservations
- [ ] Technician can validate old component serial
- [ ] Parts coordinator can create warranty components
- [ ] Parts coordinator can view adjustment history
- [ ] Managers can view usage analytics

---

## 📈 STATISTICS

### Backend Changes
- **8 Route Files Modified**
- **479 lines added** to inventory.router.js
- **111 lines removed** from componentReservations.router.js
- **122 lines removed** from guaranteeCase.router.js
- **1 NEW router** (warrantyComponent.router.js)

### Frontend Changes
- **69 Files Modified** in FE/
- **~7,000 lines deleted** (cleanup/refactoring)
- **~3,000 lines added** (improvements)

### Breaking Changes
- **2 Critical** (component return, warehouse components)
- **1 Behavior Change** (OTP removal)

### New Features Not Implemented in Frontend
- **7 New Endpoints** without frontend implementation

---

## 🔍 HOW TO SEARCH FOR ISSUES

### Find Usage of Deleted Endpoints
```bash
# Search for component return usage
git grep -n "returnComponent\|/return"

# Search for warehouse components endpoint
git grep -n "getWarehouseComponents\|/warehouses/.*/components"

# Search for batch pickup
git grep -n "pickupComponents\|reservationIds"
```

### Find OTP References
```bash
git grep -n "ensureOtpVerified\|OTP\|otp"
```

### Find Inventory Service Usage
```bash
git grep -n "inventoryService\|InventoryService"
```

---

## 📅 TIMELINE RECOMMENDATION

**Week 1: Critical Fixes**
- Remove/fix component return functionality
- Clean up warehouse service exports
- Test all existing flows for regressions

**Week 2: High Priority Features**
- Implement adjustment history UI
- Add stock history tracking
- Add old component validation to technician workflow

**Week 3: Analytics & Warranty**
- Implement usage analytics dashboard
- Research and implement warranty component feature

**Week 4: Testing & Refinement**
- Comprehensive testing of all changes
- Bug fixes and optimizations
- Documentation updates

---

**Analysis Complete**  
**Generated:** November 5, 2025  
**Commit:** 7b487e0701f52030bd60949f641790d5b3b835f1
