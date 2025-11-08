import express from "express";
import {
  authentication,
  authorizationByRole,
  validate,
} from "../middleware/index.js";
import warrantyComponents from "./warrantyComponent.router.js";
import { createVehicleModelSchema } from "../../validators/oemVehicleModel.validator.js";

const router = express.Router();

/**
 * @swagger
 * /oem-vehicle-models:
 *   post:
 *     summary: Tạo một mẫu xe mới
 *     description: >-
 *       Tạo một mẫu xe (vehicle model) mới trong hệ thống.
 *       Yêu cầu quyền `parts_coordinator_company`.
 *     tags: [Vehicle Model]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleModelName
 *               - vehicleCompanyId
 *               - sku
 *             properties:
 *               vehicleModelName:
 *                 type: string
 *                 description: Tên của mẫu xe.
 *                 example: "VF e34"
 *               vehicleCompanyId:
 *                 type: string
 *                 format: uuid
 *                 description: ID của công ty sản xuất xe.
 *               sku:
 *                 type: string
 *                 description: Mã SKU duy nhất cho mẫu xe.
 *                 example: "VFE34-PLUS-2023"
 *     responses:
 *       201:
 *         description: Tạo mẫu xe thành công.
 *       400:
 *         description: Dữ liệu không hợp lệ.
 *       401:
 *         description: Chưa xác thực.
 *       403:
 *         description: Không có quyền.
 *       409:
 *         description: Xung đột (ví dụ: SKU đã tồn tại).
 */
router.post(
  "/",
  authentication,
  authorizationByRole(["parts_coordinator_company"]),
  validate(createVehicleModelSchema, "body"),
  async (req, res, next) => {
    const oemVehicleModelController = req.container.resolve(
      "oemVehicleModelController"
    );

    await oemVehicleModelController.createVehicleModel(req, res, next);
  }
);

router.use("/:vehicleModelId/warranty-components", warrantyComponents);
export default router;
