import { Router } from "express";
import { createCustomer, getCustomers, updateCustomer } from "./controllers/customer.js";

const router = Router();

router.post('/', createCustomer);
router.get('/', getCustomers);
router.put('/:id', updateCustomer);

export default router;