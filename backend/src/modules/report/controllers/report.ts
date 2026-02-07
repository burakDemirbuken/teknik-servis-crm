import type { Request, Response } from 'express';
import prisma from '../../../prisma.js';

// Helper: parse date range from query params
function getDateRange(req: Request): { startDate: Date; endDate: Date } {
  const { period, startDate: startStr, endDate: endStr } = req.query;

  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (startStr && endStr) {
    startDate = new Date(startStr as string);
    endDate = new Date(endStr as string);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        // Default: this month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
  return { startDate, endDate };
}

// GET /api/reports/summary - Overall summary with date range
export const getSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);

    const [tickets, closedTickets, allCustomers, products] = await Promise.all([
      prisma.ticket.findMany({
        where: { created_at: { gte: startDate, lte: endDate } },
        include: { products: true },
      }),
      prisma.ticket.findMany({
        where: {
          ticketStatus: 'CLOSED',
          closed_at: { gte: startDate, lte: endDate },
        },
      }),
      prisma.customer.count(),
      prisma.product.findMany({
        where: { created_at: { gte: startDate, lte: endDate } },
      }),
    ]);

    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.ticketStatus === 'OPEN').length;
    const closedCount = closedTickets.length;
    const cancelledTickets = tickets.filter((t) => t.ticketStatus === 'CANCELLED').length;

    const totalRevenue = closedTickets.reduce(
      (sum, t) => sum + (t.total_price ? Number(t.total_price) : 0),
      0
    );
    const avgTicketPrice = closedCount > 0 ? totalRevenue / closedCount : 0;
    const completionRate = totalTickets > 0 ? Math.round((closedCount / totalTickets) * 100) : 0;

    const repairTimes = closedTickets
      .filter((t) => t.closed_at && t.created_at)
      .map((t) => {
        const created = new Date(t.created_at).getTime();
        const closed = new Date(t.closed_at!).getTime();
        return (closed - created) / (1000 * 60 * 60); // hours
      });
    const avgRepairTimeHours = repairTimes.length > 0
      ? repairTimes.reduce((a, b) => a + b, 0) / repairTimes.length
      : 0;
    const minRepairTimeHours = repairTimes.length > 0 ? Math.min(...repairTimes) : 0;
    const maxRepairTimeHours = repairTimes.length > 0 ? Math.max(...repairTimes) : 0;

    const totalProducts = products.length;
    const productsByStatus: Record<string, number> = {};
    products.forEach((p) => {
      productsByStatus[p.status] = (productsByStatus[p.status] || 0) + 1;
    });

    res.json({
      period: { startDate, endDate },
      tickets: {
        total: totalTickets,
        open: openTickets,
        closed: closedCount,
        cancelled: cancelledTickets,
      },
      revenue: {
        total: totalRevenue,
        average: Math.round(avgTicketPrice * 100) / 100,
      },
      completionRate,
      customers: {
        total: allCustomers,
      },
      products: {
        total: totalProducts,
        byStatus: productsByStatus,
      },
      repairTime: {
        averageHours: Math.round(avgRepairTimeHours * 10) / 10,
        minHours: Math.round(minRepairTimeHours * 10) / 10,
        maxHours: Math.round(maxRepairTimeHours * 10) / 10,
        sampleSize: repairTimes.length,
      },
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Error occurred while fetching summary.' });
  }
};

// GET /api/reports/daily-trend - Daily ticket/revenue trend for charts
export const getDailyTrend = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);

    const tickets = await prisma.ticket.findMany({
      where: { created_at: { gte: startDate, lte: endDate } },
      select: {
        id: true,
        created_at: true,
        ticketStatus: true,
        total_price: true,
        closed_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    // Group by day
    const dailyMap: Record<string, { date: string; created: number; closed: number; revenue: number }> = {};

    // Fill all days in range
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().split('T')[0]!;
      dailyMap[key] = { date: key, created: 0, closed: 0, revenue: 0 };
      current.setDate(current.getDate() + 1);
    }

    tickets.forEach((t) => {
      const createdKey = t.created_at.toISOString().split('T')[0]!;
      if (dailyMap[createdKey]) {
        dailyMap[createdKey].created++;
      }

      if (t.ticketStatus === 'CLOSED' && t.closed_at) {
        const closedKey = t.closed_at.toISOString().split('T')[0]!;
        if (dailyMap[closedKey]) {
          dailyMap[closedKey].closed++;
          dailyMap[closedKey].revenue += t.total_price ? Number(t.total_price) : 0;
        }
      }
    });

    const trend = Object.values(dailyMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json(trend);
  } catch (error) {
    console.error('Error fetching daily trend:', error);
    res.status(500).json({ error: 'Error occurred while fetching daily trend.' });
  }
};

// GET /api/reports/top-customers - Top customers by ticket count and revenue
export const getTopCustomers = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);

    const customers = await prisma.customer.findMany({
      include: {
        tickets: {
          where: { created_at: { gte: startDate, lte: endDate } },
          include: { products: true },
        },
      },
    });

    const topCustomers = customers
      .map((c) => ({
        id: c.id,
        name: `${c.name} ${c.surname}`,
        phone: c.phone,
        ticketCount: c.tickets.length,
        openTickets: c.tickets.filter((t) => t.ticketStatus === 'OPEN').length,
        closedTickets: c.tickets.filter((t) => t.ticketStatus === 'CLOSED').length,
        totalRevenue: c.tickets.reduce(
          (sum, t) => sum + (t.total_price ? Number(t.total_price) : 0),
          0
        ),
        totalProducts: c.tickets.reduce((sum, t) => sum + t.products.length, 0),
      }))
      .filter((c) => c.ticketCount > 0)
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 10);

    res.json(topCustomers);
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ error: 'Error occurred while fetching top customers.' });
  }
};

// GET /api/reports/product-types - Product type distribution
export const getProductTypeStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);

    const productTypes = await prisma.productType.findMany({
      include: {
        products: {
          where: { created_at: { gte: startDate, lte: endDate } },
        },
      },
    });

    const stats = productTypes
      .map((pt) => ({
        id: pt.id,
        type: pt.type,
        count: pt.products.length,
        statusBreakdown: pt.products.reduce(
          (acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      }))
      .sort((a, b) => b.count - a.count);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching product type stats:', error);
    res.status(500).json({ error: 'Error occurred while fetching product type stats.' });
  }
};

// GET /api/reports/monthly - Monthly comparison (last 12 months)
export const getMonthlyComparison = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const tickets = await prisma.ticket.findMany({
      where: { created_at: { gte: startDate } },
      select: {
        id: true,
        created_at: true,
        ticketStatus: true,
        total_price: true,
        closed_at: true,
      },
    });

    // Group by month
    const monthlyMap: Record<string, { month: string; created: number; closed: number; revenue: number }> = {};

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      monthlyMap[key] = {
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        created: 0,
        closed: 0,
        revenue: 0,
      };
    }

    tickets.forEach((t) => {
      const createdKey = `${t.created_at.getFullYear()}-${String(t.created_at.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[createdKey]) {
        monthlyMap[createdKey].created++;
      }

      if (t.ticketStatus === 'CLOSED' && t.closed_at) {
        const closedKey = `${t.closed_at.getFullYear()}-${String(t.closed_at.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[closedKey]) {
          monthlyMap[closedKey].closed++;
          monthlyMap[closedKey].revenue += t.total_price ? Number(t.total_price) : 0;
        }
      }
    });

    const monthly = Object.values(monthlyMap);

    res.json(monthly);
  } catch (error) {
    console.error('Error fetching monthly comparison:', error);
    res.status(500).json({ error: 'Error occurred while fetching monthly comparison.' });
  }
};
