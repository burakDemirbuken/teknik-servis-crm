import { Router } from "express";
import { getProducts, updateProduct, deleteProduct } from "./controllers/product.js";

const router = Router();

router.get('/', getProducts);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;