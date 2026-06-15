import { Router } from "express";
import * as explorerController from "../controllers/explorerController";

const router = Router();

router.get("/stats", explorerController.getDashboardStats);

export default router;
