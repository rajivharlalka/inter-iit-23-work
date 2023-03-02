import express from "express";
import controllers from "../controllers/rider.controller.js";

const router = express.Router();

router.post("/add", controllers.addRider);
router.get("/list", controllers.getPackagesOfRider);
router.get("/all", controllers.getAllRiders);

// router.get("/details", controllers.getRiderDetails);

router.get("/location", controllers.getRiderLocation);

router.post("/location", controllers.setRiderLocation);

// router.patch("/location", controllers.updateRiderLocation);

export default router;
