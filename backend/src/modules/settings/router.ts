import { Router } from "express";
import { createProductType, getProductTypes, createShelf, getShelves } from "./controllers/setting.js";

const router = Router();

router.post("/product-types", createProductType);
router.get("/product-types", getProductTypes);

router.post("/shelves", createShelf);
router.get("/shelves", getShelves);

export default router;