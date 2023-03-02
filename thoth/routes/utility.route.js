import express from "express";
import {
    calculateError,
    uploadDeliveryFiles,
    uploadDeliveryExcel,
    downloadGeoJSON,
    Warehouse_status,
    rider_status,
    route_stats,
    startSimutation,
    stopSimutation,
    resumeSimulation,
} from "../controllers/utility.controller.js";

const router = express.Router();

router.get("/error", calculateError);
router.post("/csv/package", uploadDeliveryFiles);
router.post("/xls/package", uploadDeliveryExcel);
router.get("/geojson/download", downloadGeoJSON);
router.get("/notif/warehouse", Warehouse_status);
router.get("/notif/rider", rider_status);
router.get("/stats", route_stats);
router.post("/simulate/start", startSimutation);
router.post("/simulate/stop", stopSimutation);
router.post("/simulate/resume", resumeSimulation);

export default router;
