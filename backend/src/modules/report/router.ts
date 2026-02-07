import { Router } from 'express';
import {
  getSummary,
  getDailyTrend,
  getTopCustomers,
  getProductTypeStats,
  getMonthlyComparison,
} from './controllers/report.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/daily-trend', getDailyTrend);
router.get('/top-customers', getTopCustomers);
router.get('/product-types', getProductTypeStats);
router.get('/monthly', getMonthlyComparison);

export default router;
