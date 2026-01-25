import { Router } from "express";
import { getProducts, updateProduct } from "./controllers/product.js";

const router = Router();

router.get('/', getProducts);
router.patch('/:id', updateProduct);

export default router;