import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '../api';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  Smartphone,
  Laptop,
  Download,
  Timer,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type Period = 'today' | 'week' | 'month' | '3months' | 'year' | 'custom';

interface SummaryData {
  period: { startDate: string; endDate: string };
  tickets: { total: number; open: number; closed: number; cancelled: number };
  revenue: { total: number; average: number };
  completionRate: number;
  customers: { total: number };
  products: { total: number; byStatus: Record<string, number> };
  repairTime: { averageHours: number; minHours: number; maxHours: number; sampleSize: number };
}

interface DailyTrendItem {
  date: string;
  created: number;
  closed: number;
  revenue: number;
}

interface TopCustomer {
  id: number;
  name: string;
  phone: string;
  ticketCount: number;
  openTickets: number;
  closedTickets: number;
  totalRevenue: number;
  totalProducts: number;
}

interface ProductTypeStat {
  id: number;
  type: string;
  count: number;
  statusBreakdown: Record<string, number>;
}

interface MonthlyItem {
  month: string;
  created: number;
  closed: number;
  revenue: number;
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Bugün',
  week: 'Son 7 Gün',
  month: 'Bu Ay',
  '3months': 'Son 3 Ay',
  year: 'Bu Yıl',
  custom: 'Özel Tarih',
};

const PIE_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6', '#ef4444'];

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Teslim Alındı',
  IN_REPAIR: 'Tamirde',
  WAITING_PARTS: 'Parça Bekliyor',
  COMPLETED: 'Tamamlandı',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#3b82f6',
  IN_REPAIR: '#3b82f6',
  WAITING_PARTS: '#8b5cf6',
  COMPLETED: '#06b6d4',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      {payload.map((item: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: item.color }}>
          {item.name}: <span className="font-semibold">{item.name === 'Gelir' ? `₺${item.value.toLocaleString('tr-TR')}` : item.value}</span>
        </p>
      ))}
    </div>
  );
};

export const ReportsPage = () => {
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const queryParams = useMemo(() => {
    if (period === 'custom' && customStart && customEnd) {
      return `startDate=${customStart}&endDate=${customEnd}`;
    }
    return `period=${period}`;
  }, [period, customStart, customEnd]);

  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ['report-summary', queryParams],
    queryFn: async () => (await reportAPI.getSummary(queryParams)).data,
  });

  const { data: dailyTrend = [] } = useQuery<DailyTrendItem[]>({
    queryKey: ['report-daily-trend', queryParams],
    queryFn: async () => (await reportAPI.getDailyTrend(queryParams)).data,
  });

  const { data: topCustomers = [] } = useQuery<TopCustomer[]>({
    queryKey: ['report-top-customers', queryParams],
    queryFn: async () => (await reportAPI.getTopCustomers(queryParams)).data,
  });

  const { data: productTypes = [] } = useQuery<ProductTypeStat[]>({
    queryKey: ['report-product-types', queryParams],
    queryFn: async () => (await reportAPI.getProductTypeStats(queryParams)).data,
  });

  const { data: monthly = [] } = useQuery<MonthlyItem[]>({
    queryKey: ['report-monthly'],
    queryFn: async () => (await reportAPI.getMonthlyComparison()).data,
  });

  // Format daily trend dates for display
  const formattedTrend = useMemo(
    () =>
      dailyTrend.map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      })),
    [dailyTrend]
  );

  // Product status pie data
  const productStatusPie = useMemo(() => {
    if (!summary?.products?.byStatus) return [];
    return Object.entries(summary.products.byStatus).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#6b7280',
    }));
  }, [summary]);

  // Product type pie data
  const productTypePie = useMemo(
    () =>
      productTypes
        .filter((pt) => pt.count > 0)
        .map((pt, i) => ({
          name: pt.type,
          value: pt.count,
          color: PIE_COLORS[i % PIE_COLORS.length],
        })),
    [productTypes]
  );

  const handleExportCSV = () => {
    if (!topCustomers.length) return;
    const headers = ['Müşteri', 'Telefon', 'Servis Sayısı', 'Açık', 'Kapalı', 'Toplam Gelir', 'Ürün Sayısı'];
    const rows = topCustomers.map((c) => [
      c.name,
      c.phone,
      c.ticketCount,
      c.openTickets,
      c.closedTickets,
      c.totalRevenue,
      c.totalProducts,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapor-musteriler-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-sora flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Raporlar
          </h1>
          <p className="text-gray-400 mt-1 ml-[52px]">Detaylı istatistikler ve analizler</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl transition-all text-sm"
        >
          <Download className="w-4 h-4" />
          CSV İndir
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {(Object.keys(PERIOD_LABELS) as Period[])
            .filter((p) => p !== 'custom')
            .map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          <button
            onClick={() => setPeriod('custom')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === 'custom'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Özel Tarih
          </button>
          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">—</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Toplam Servis"
          value={summary?.tickets.total ?? 0}
          icon={<Package className="w-5 h-5" />}
          color="from-blue-500 to-blue-600"
          detail={`${summary?.tickets.open ?? 0} açık`}
        />
        <SummaryCard
          title="Toplam Gelir"
          value={`₺${(summary?.revenue.total ?? 0).toLocaleString('tr-TR')}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="from-emerald-500 to-emerald-600"
          detail={`Ort: ₺${(summary?.revenue.average ?? 0).toLocaleString('tr-TR')}`}
        />
        <SummaryCard
          title="Tamamlanma Oranı"
          value={`%${summary?.completionRate ?? 0}`}
          icon={<Percent className="w-5 h-5" />}
          color="from-blue-500 to-blue-600"
          detail={`${summary?.tickets.closed ?? 0} kapatıldı`}
        />
        <SummaryCard
          title="Toplam Müşteri"
          value={summary?.customers.total ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="from-purple-500 to-purple-600"
          detail={`${summary?.products.total ?? 0} ürün`}
        />
      </div>

      {/* Repair Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <Timer className="w-6 h-6 text-cyan-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {summary?.repairTime?.averageHours != null
                ? summary.repairTime.averageHours < 24
                  ? `${summary.repairTime.averageHours} saat`
                  : `${(summary.repairTime.averageHours / 24).toFixed(1)} gün`
                : '—'}
            </p>
            <p className="text-sm text-gray-400">Ort. Tamir Süresi</p>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {summary?.repairTime?.minHours != null && summary.repairTime.sampleSize > 0
                ? summary.repairTime.minHours < 24
                  ? `${summary.repairTime.minHours} saat`
                  : `${(summary.repairTime.minHours / 24).toFixed(1)} gün`
                : '—'}
            </p>
            <p className="text-sm text-gray-400">En Hızlı Tamir</p>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {summary?.repairTime?.maxHours != null && summary.repairTime.sampleSize > 0
                ? summary.repairTime.maxHours < 24
                  ? `${summary.repairTime.maxHours} saat`
                  : `${(summary.repairTime.maxHours / 24).toFixed(1)} gün`
                : '—'}
            </p>
            <p className="text-sm text-gray-400">En Uzun Tamir</p>
          </div>
        </div>
      </div>

      {/* Ticket Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{summary?.tickets.open ?? 0}</p>
            <p className="text-sm text-gray-400">Açık Servis</p>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{summary?.tickets.closed ?? 0}</p>
            <p className="text-sm text-gray-400">Kapatılan Servis</p>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{summary?.tickets.cancelled ?? 0}</p>
            <p className="text-sm text-gray-400">İptal Edilen</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Daily Trend + Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Chart */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Günlük Servis Trendi
          </h3>
          <p className="text-sm text-gray-500 mb-4">Açılan ve kapatılan servis sayıları</p>
          {formattedTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={formattedTrend}>
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Açılan"
                  stroke="#3b82f6"
                  fill="url(#gradCreated)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="closed"
                  name="Kapatılan"
                  stroke="#06b6d4"
                  fill="url(#gradClosed)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              Bu dönem için veri bulunamadı
            </div>
          )}
        </div>

        {/* Monthly Comparison Chart */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            Aylık Karşılaştırma
          </h3>
          <p className="text-sm text-gray-500 mb-4">Son 12 ayın servis ve gelir verileri</p>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="created" name="Açılan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" name="Kapatılan" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              Veri bulunamadı
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Revenue Trend + Product Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Gelir Trendi
          </h3>
          <p className="text-sm text-gray-500 mb-4">Günlük gelir değişimi</p>
          {formattedTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={formattedTrend}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₺${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gelir"
                  stroke="#10b981"
                  fill="url(#gradRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              Bu dönem için veri bulunamadı
            </div>
          )}
        </div>

        {/* Product Distribution */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-500" />
            Ürün Dağılımı
          </h3>
          <p className="text-sm text-gray-500 mb-4">Ürün tiplerine göre dağılım</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Product Status Pie */}
            <div>
              <p className="text-xs text-gray-400 mb-2 text-center">Durum</p>
              {productStatusPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={productStatusPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {productStatusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">
                  Veri yok
                </div>
              )}
            </div>
            {/* Product Type Pie */}
            <div>
              <p className="text-xs text-gray-400 mb-2 text-center">Tip</p>
              {productTypePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={productTypePie}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {productTypePie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">
                  Veri yok
                </div>
              )}
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {[...productStatusPie, ...productTypePie].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-400">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-500" />
          En Aktif Müşteriler
        </h3>
        <p className="text-sm text-gray-500 mb-4">Servis sayısına göre sıralama</p>

        {topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">#</th>
                  <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Müşteri</th>
                  <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Telefon</th>
                  <th className="text-center text-xs text-gray-400 font-medium pb-3 pr-4">Servis</th>
                  <th className="text-center text-xs text-gray-400 font-medium pb-3 pr-4">Açık</th>
                  <th className="text-center text-xs text-gray-400 font-medium pb-3 pr-4">Kapalı</th>
                  <th className="text-center text-xs text-gray-400 font-medium pb-3 pr-4">Ürün</th>
                  <th className="text-right text-xs text-gray-400 font-medium pb-3">Gelir</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer, i) => (
                  <tr key={customer.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                          i === 0
                            ? 'bg-amber-500/20 text-amber-500'
                            : i === 1
                            ? 'bg-gray-400/20 text-gray-400'
                            : i === 2
                            ? 'bg-orange-500/20 text-orange-500'
                            : 'bg-gray-700/50 text-gray-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="text-white font-medium text-sm truncate max-w-[150px]" title={customer.name}>{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-400 text-sm">{customer.phone}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className="bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {customer.ticketCount}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className="text-yellow-400 text-sm font-medium">{customer.openTickets}</span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className="text-green-400 text-sm font-medium">{customer.closedTickets}</span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className="text-gray-300 text-sm">{customer.totalProducts}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-emerald-400 font-semibold text-sm">
                        ₺{customer.totalRevenue.toLocaleString('tr-TR')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">Bu dönem için müşteri verisi bulunamadı</div>
        )}
      </div>

      {/* Product Type Breakdown */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Laptop className="w-5 h-5 text-blue-500" />
          Ürün Tipi Detayları
        </h3>
        <p className="text-sm text-gray-500 mb-4">Her ürün tipinin durum dağılımı</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {productTypes.map((pt) => (
            <div key={pt.id} className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">{pt.type}</h4>
                <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-lg text-xs font-bold">
                  {pt.count}
                </span>
              </div>
              {pt.count > 0 ? (
                <div className="space-y-2">
                  {Object.entries(pt.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#6b7280' }} />
                      <span className="text-xs text-gray-400 flex-1">{STATUS_LABELS[status] || status}</span>
                      <span className="text-xs text-gray-300 font-medium">{count}</span>
                    </div>
                  ))}
                  {/* Mini progress bar */}
                  <div className="flex h-2 rounded-full overflow-hidden mt-2">
                    {Object.entries(pt.statusBreakdown).map(([status, count]) => (
                      <div
                        key={status}
                        className="h-full"
                        style={{
                          backgroundColor: STATUS_COLORS[status] || '#6b7280',
                          width: `${(count / pt.count) * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Veri yok</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({
  title,
  value,
  icon,
  color,
  detail,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  detail?: string;
}) => (
  <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-5 hover:border-gray-600 transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-sm text-gray-400 mt-0.5">{title}</p>
    {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
  </div>
);
