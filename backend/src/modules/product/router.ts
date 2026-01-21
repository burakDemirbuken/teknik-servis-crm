import { Router } from "express";
import { updateProduct } from "./controllers/product.js";

const router = Router();

router.patch('/:id', updateProduct);

export default router;