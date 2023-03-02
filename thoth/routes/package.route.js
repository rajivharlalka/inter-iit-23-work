import express from "express";
import controllers from "../controllers/package.controller.js";
import uploadImage from "../middlewares/multer.js";
const router = express.Router();

router.post("/delivery", controllers.addDeliveryPackage);
router.get("/details", controllers.getPackageDetails);
router.get("/list", controllers.getPackageList);
router.post("/upload_image", uploadImage.single("image"), controllers.uploadImageController);
router.post("/pickup", controllers.addDynamicPackage);
router.post("/delete", controllers.deletePackage);
router.post("/upload_data", controllers.uploadDataController);

export default router;
