import express from "express";
import container from "../../../../container.js";
import { authentication } from "../middleware/index.js";

const router = express.Router();

const notificationController = container.resolve("notificationController");

router.get("/", authentication, notificationController.getNotifications);
router.patch("/:id/read", authentication, notificationController.markAsRead);
router.post("/mark-all-as-read", authentication, notificationController.markAllAsRead);

export default router;
