import express from "express";
import {
  attachCompanyContext,
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import { createInventoryAdjustmentBodySchema } from "../../validators/inventory.validator.js";

const router = express.Router();

/**
 * @swagger
 * /inventory/summary:
 *   get:
 *     summary: Lấy tổng hợp tồn kho theo kho
 *     description: Lấy thông tin tổng hợp số lượng tồn kho, đã đặt trước, và khả dụng cho mỗi kho thuộc phạm vi quản lý. Parts coordinator service center chỉ thấy kho của service center mình, parts coordinator company thấy tất cả kho của công ty.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceCenterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter theo service center (optional, chỉ áp dụng cho parts_coordinator_company)
 *     responses:
 *       200:
 *         description: Lấy tổng hợp tồn kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       warehouseId:
 *                         type: string
 *                         format: uuid
 *                       warehouseName:
 *                         type: string
 *                         example: Kho Trung Tâm Hà Nội
 *                       totalStock:
 *                         type: integer
 *                         example: 500
 *                         description: Tổng số lượng tồn kho
 *                       totalReserved:
 *                         type: integer
 *                         example: 50
 *                         description: Tổng số lượng đã đặt trước
 *                       totalAvailable:
 *                         type: integer
 *                         example: 450
 *                         description: Tổng số lượng khả dụng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get(
  "/summary",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.getInventorySummary(req, res, next);
  }
);

/**
 * @swagger
 * /inventory/type-components:
 *   get:
 *     summary: Lấy chi tiết tồn kho theo loại linh kiện
 *     description: Lấy thông tin chi tiết từng loại linh kiện trong kho, bao gồm tên, SKU, danh mục, số lượng tồn kho, đã đặt trước, và khả dụng. Hỗ trợ phân trang và filter theo kho.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter theo warehouse cụ thể (optional)
 *       - in: query
 *         name: serviceCenterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter theo service center (optional, chỉ áp dụng cho parts_coordinator_company)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [HIGH_VOLTAGE_BATTERY, POWERTRAIN, CHARGING_SYSTEM, THERMAL_MANAGEMENT, LOW_VOLTAGE_SYSTEM, BRAKING, SUSPENSION_STEERING, HVAC, BODY_CHASSIS, INFOTAINMENT_ADAS]
 *         description: Filter theo danh mục linh kiện (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang (bắt đầu từ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng kết quả mỗi trang
 *     responses:
 *       200:
 *         description: Lấy chi tiết tồn kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stockId:
 *                             type: string
 *                             format: uuid
 *                           warehouseId:
 *                             type: string
 *                             format: uuid
 *                           warehouseName:
 *                             type: string
 *                             example: Kho Trung Tâm Hà Nội
 *                           typeComponentId:
 *                             type: string
 *                             format: uuid
 *                           typeComponentName:
 *                             type: string
 *                             example: Màn Hình LCD 12 inch
 *                           sku:
 *                             type: string
 *                             example: LCD-12-VF34
 *                           category:
 *                             type: string
 *                             example: INFOTAINMENT_ADAS
 *                           quantityInStock:
 *                             type: integer
 *                             example: 50
 *                           quantityReserved:
 *                             type: integer
 *                             example: 5
 *                           quantityAvailable:
 *                             type: integer
 *                             example: 45
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalItems:
 *                           type: integer
 *                           example: 100
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 20
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get(
  "/type-components",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.getInventoryTypeComponents(req, res, next);
  }
);

/**
 * @swagger
 * /inventory/most-used-type-components:
 *   get:
 *     summary: Thống kê loại linh kiện được sử dụng nhiều nhất
 *     description: Lấy danh sách các loại linh kiện đã được sử dụng (install) nhiều nhất trong các caseline hoàn thành, có filter theo khoảng thời gian.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng kết quả tối đa
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại (bắt đầu từ 1)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Thời điểm bắt đầu tính thống kê (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Thời điểm kết thúc thống kê (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     components:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               typeComponentId:
 *                                 type: string
 *                                 format: uuid
 *                               typeComponentName:
 *                                 type: string
 *                                 example: Pin cao áp 60kWh
 *                               usageCount:
 *                                 type: integer
 *                                 example: 25
 *                               warehouses:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     warehouseId:
 *                                       type: string
 *                                       format: uuid
 *                                     warehouseName:
 *                                       type: string
 *                                     quantityUsed:
 *                                       type: integer
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               example: 50
 *                             pages:
 *                               type: integer
 *                               example: 5
 *                             limit:
 *                               type: integer
 *                               example: 10
 *                             page:
 *                               type: integer
 *                               example: 1
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get(
  "/most-used-type-components",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "service_center_manager",
    "evm_staff",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.findMostUsedTypeComponentsInWarehouse(
      req,
      res,
      next
    );
  }
);

/**
 * @swagger
 * /inventory/adjustments:
 *   post:
 *     summary: Tạo điều chỉnh tồn kho thủ công
 *     description: |
 *       Tạo một phiếu điều chỉnh kho. Hỗ trợ 2 kịch bản:
 *       1.  **Nhập kho (`adjustmentType: IN`):** Cung cấp một danh sách các `components` mới (với serial number) để thêm vào hệ thống. Hệ thống sẽ tạo các bản ghi `Component` mới và tự động cập nhật `quantityInStock`.
 *       2.  **Xuất kho (`adjustmentType: OUT`):** Cung cấp `quantity` để giảm số lượng tồn kho. Dùng cho các trường hợp hàng hỏng, mất mát, v.v.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/InventoryAdjustmentIn'
 *               - $ref: '#/components/schemas/InventoryAdjustmentOut'
 *           examples:
 *             in:
 *               summary: Ví dụ Nhập kho
 *               value:
 *                 stockId: "550e8400-e29b-41d4-a716-446655440000"
 *                 adjustmentType: "IN"
 *                 reason: "SUPPLIER_DELIVERY"
 *                 note: "Nhập hàng từ NCC A"
 *                 components:
 *                   - serialNumber: "SN10001"
 *                   - serialNumber: "SN10002"
 *             out:
 *               summary: Ví dụ Xuất kho
 *               value:
 *                 stockId: "550e8400-e29b-41d4-a716-446655440000"
 *                 adjustmentType: "OUT"
 *                 reason: "DAMAGE"
 *                 quantity: 2
 *     responses:
 *       201:
 *         description: Tạo điều chỉnh tồn kho thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy stock item
 *       409:
 *         description: Conflict - Không đủ số lượng khả dụng cho adjustment type OUT
 */
router.post(
  "/adjustments",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  validate(createInventoryAdjustmentBodySchema, "body"),
  // validate(createInventoryAdjustmentQuerySchema, "query"),
  attachCompanyContext,

  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");

    await inventoryController.createInventoryAdjustment(req, res, next);
  }
);

/**
 * @swagger
 * /inventory/adjustments:
 *   get:
 *     summary: Lấy lịch sử các lần điều chỉnh kho
 *     description: Parts coordinator lấy danh sách lịch sử các phiếu điều chỉnh kho (nhập/xuất thủ công) để kiểm toán và truy vết. Hỗ trợ filter và phân trang.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ID của kho
 *       - in: query
 *         name: typeComponentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ID của loại linh kiện
 *       - in: query
 *         name: adjustmentType
 *         schema:
 *           type: string
 *           enum: [IN, OUT]
 *         description: Lọc theo loại điều chỉnh (IN hoặc OUT)
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *         description: Lọc theo lý do điều chỉnh (ví dụ, SUPPLIER_DELIVERY, DAMAGE)
 *       - in: query
 *         name: adjustedByUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ID người thực hiện
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lấy lịch sử điều chỉnh thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryAdjustment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         totalItems:
 *                           type: integer
 *                           example: 55
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 20
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get(
  "/adjustments",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");
    await inventoryController.getInventoryAdjustments(req, res, next);
  }
);

/**
 * @swagger
 * /inventory/adjustments/{adjustmentId}:
 *   get:
 *     summary: Lấy chi tiết một phiếu điều chỉnh kho
 *     description: Parts coordinator lấy chi tiết một phiếu điều chỉnh kho bằng ID của nó. Cần có đủ quyền hạn và ID hợp lệ.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adjustmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của phiếu điều chỉnh kho
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Lấy chi tiết phiếu điều chỉnh kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/InventoryAdjustment'
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiếu điều chỉnh kho
 */
router.get(
  "/adjustments/:adjustmentId",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");
    await inventoryController.getInventoryAdjustmentById(req, res, next);
  }
);

/**
 * @swagger
 * /inventory/stocks/{stockId}/history:
 *   get:
 *     summary: Lấy lịch sử giao dịch của một mục tồn kho
 *     description: Lấy một sổ cái (ledger) đầy đủ, được sắp xếp theo thời gian, của tất cả các giao dịch cho một `stockId` cụ thể. Bao gồm điều chỉnh thủ công, đặt trước, sử dụng, và chuyển kho.
 *     tags: [Inventory Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stockId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của mục tồn kho (stock item)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           eventType:
 *                             type: string
 *                             enum: [ADJUSTMENT_IN, ADJUSTMENT_OUT, RESERVATION_CREATED, RESERVATION_CANCELLED, INSTALLATION, STOCK_TRANSFER_OUT, STOCK_TRANSFER_IN]
 *                           quantityChange:
 *                             type: integer
 *                           eventDate:
 *                             type: string
 *                             format: date-time
 *                           details:
 *                             type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy mục tồn kho
 */
router.get(
  "/stocks/:stockId/history",
  authentication,
  authorizationByRole([
    "parts_coordinator_company",
    "parts_coordinator_service_center",
  ]),
  attachCompanyContext,
  async (req, res, next) => {
    const inventoryController = req.container.resolve("inventoryController");
    await inventoryController.getStockHistory(req, res, next);
  }
);

export default router;
