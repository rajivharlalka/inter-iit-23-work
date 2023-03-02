import express from "express";
import controllers from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/rider", controllers.loginRider);
router.post("/admin", controllers.loginAdmin);

export default router;
