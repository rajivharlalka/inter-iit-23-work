import express from "express";
import controllers from "../controllers/bin.controller.js";
const router = express.Router();

router.get("/details", controllers.getBinList);

export default router;
