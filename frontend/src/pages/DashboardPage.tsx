import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ticketAPI, customerAPI } from '../api';
import type { Ticket, Customer } from '../types';
import { Package, Clock, Check, ChevronRight, Plus, Users, XCircle } from 'lucide-react';

const ticketStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: 'Açık', color: 'bg-yellow-500', icon: Clock },
  CLOSED: { label: 'Kapatıldı', color: 'bg-green-500', icon: Check },
  CANCELLED: { label: 'İptal', color: 'bg-red-500', icon: XCircle },
};

export const DashboardPage = () => {
  const navigate = useNavigate();

  const { data: ticketsResponse, isLoading: ticketsLoading } = useQuery({
    queryKey: ['dashboard-tickets'],
    queryFn: () => ticketAPI.getAll(1, 50),
  });

  const tickets = ticketsResponse?.data?.data || [];

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => (await customerAPI.getAll()).data,
  });

  const totalTickets = ticketsResponse?.data?.meta?.total || tickets.length;

  const stats = {
    total: totalTickets,
    open: tickets.filter((t: any) => t.ticketStatus === 'OPEN').length,
    closed: tickets.filter((t: any) => t.ticketStatus === 'CLOSED').length,
    customers: customers.length,
  };

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 font-sora">Dashboard</h1>
          <p className="text-gray-400">Teknik servis genel görünüm</p>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          Yeni Servis
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-gray-400 text-sm mb-1">Toplam Servis</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-2xl">⏰</span>
          </div>
          <p className="text-gray-400 text-sm mb-1">Açık</p>
          <p className="text-3xl font-bold text-white">{stats.open}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-green-500/50 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-gray-400 text-sm mb-1">Kapatılan</p>
          <p className="text-3xl font-bold text-white">{stats.closed}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-gray-400 text-sm mb-1">Müşteriler</p>
          <p className="text-3xl font-bold text-white">{stats.customers}</p>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Son Servisler</h2>
          <button
            onClick={() => navigate('/tickets')}
            className="text-blue-500 hover:text-blue-400 text-sm font-medium flex items-center gap-1"
          >
            Tümünü Gör <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Henüz servis kaydı bulunmuyor</p>
          ) : (
            tickets.slice(0, 5).map((ticket: any) => {
              const statusCfg = ticketStatusConfig[ticket.ticketStatus] || ticketStatusConfig.OPEN;
              const StatusIcon = statusCfg.icon;
              return (
                <div
                  key={ticket.id}
                  className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-blue-500/50 cursor-pointer transition-all group"
                  onClick={() => navigate('/tickets')}
                >
                  <div className={`w-10 h-10 ${statusCfg.color} rounded-lg flex items-center justify-center`}>
                    <StatusIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {ticket.customer ? `${ticket.customer.name} ${ticket.customer.surname}` : `Müşteri #${ticket.customerId}`}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {ticket.products && ticket.products.length > 0
                        ? `${ticket.products[0].brand || ''} ${ticket.products[0].model || ''}`.trim() || 'Ürün bilgisi yok'
                        : ticket.issue_description || 'Açıklama yok'}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-gray-400 text-xs">#{ticket.id}</p>
                    <p className="text-xs font-medium text-blue-500">
                      {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
