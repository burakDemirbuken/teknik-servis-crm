import { Router } from "express";
import { createTicket, getTickets, closeTicket } from "./controllers/ticket.js";

const router = Router();

router.post('/', createTicket);
router.get('/', getTickets);
router.put('/:id/close', closeTicket);

export default router;