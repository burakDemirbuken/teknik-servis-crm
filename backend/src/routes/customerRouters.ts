import { Router } from "express";
import { createCustomer, getCustomers } from "../controllers/customerControllers.js";

const router = Router();

router.post('/customers', createCustomer);
router.get('/customers', getCustomers);

export default router;