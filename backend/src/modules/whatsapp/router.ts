import { Router } from "express";
import { getStatus, connect, disconnect, sendMessage } from "./controllers/whatsapp.js";

const router = Router();

router.get("/status", getStatus);
router.post("/connect", connect);
router.post("/disconnect", disconnect);
router.post("/send", sendMessage);

export default router;