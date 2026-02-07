import { Router } from "express";
import { createTicket, getTickets, updateTicket, closeTicket, reopenTicket, addProductToTicket, cancelTicket, deleteTicket } from "./controllers/ticket.js";

const router = Router();

router.post('/', createTicket);
router.get('/', getTickets);
router.patch('/:id', updateTicket);
router.put('/:id/close', closeTicket);
router.put('/:id/reopen', reopenTicket);
router.put('/:id/cancel', cancelTicket);
router.delete('/:id', deleteTicket);
router.post('/:id/products', addProductToTicket);

export default router;