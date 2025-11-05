import express from "express";
import { authentication, authorizationByRole } from "../middleware/index.js";
import warrantyComponents from "./warrantyComponent.router.js";

const router = express.Router();

router.post(
  "/",
  authentication,
  authorizationByRole(["parts_coordinator_company"]),
  async (req, res, next) => {
    const oemVehicleModelController = req.container.resolve(
      "oemVehicleModelController"
    );

    await oemVehicleModelController.createVehicleModel(req, res, next);
  }
);

router.use("/:vehicleModelId/warranty-components", warrantyComponents);
export default router;
