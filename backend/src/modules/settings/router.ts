import { Router } from "express";
import { createProductType, getProductTypes, updateProductType, deleteProductType, createShelf, getShelves, updateShelf, deleteShelf, getShelfInventory } from "./controllers/setting.js";

const router = Router();

router.post("/product-types", createProductType);
router.get("/product-types", getProductTypes);
router.put("/product-types/:id", updateProductType);
router.delete("/product-types/:id", deleteProductType);

router.post("/shelves", createShelf);
router.get("/shelves", getShelves);
router.get("/shelves/inventory", getShelfInventory);
router.put("/shelves/:id", updateShelf);
router.delete("/shelves/:id", deleteShelf);

export default router;