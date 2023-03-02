import express from "express";
import controllers from "../controllers/route.controller.js";

const router = express.Router();

router.get("/details", controllers.getRouteDetails);
router.post("/add", controllers.addRoute);
router.get("/list", controllers.getRouteList);
router.patch("/update_rider", controllers.updateRider);
router.patch("/update", controllers.updateRoute);

export default router;
