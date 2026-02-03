import { useQuery } from '@tanstack/react-query';
import { customerAPI, ticketAPI, productAPI } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Users, Ticket, Package, TrendingUp } from 'lucide-react';

export const DashboardPage = () => {
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerAPI.getAll,
  });

  const { data: tickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: ticketAPI.getAll,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll,
  });

  const stats = [
    {
      name: 'Toplam Müşteri',
      value: customers?.length || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Aktif Servisler',
      value: tickets?.filter(t => t.ticketStatus !== 'CLOSED').length || 0,
      icon: Ticket,
      color: 'bg-green-500',
    },
    {
      name: 'Toplam Ürün',
      value: products?.length || 0,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      name: 'Tamamlanan',
      value: tickets?.filter(t => t.ticketStatus === 'CLOSED').length || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  const recentTickets = tickets?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Teknik Servis İstatistikleri</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="!p-6">
              <div className="flex items-center gap-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Tickets */}
      <Card title="Son Servisler">
        <div className="space-y-3">
          {recentTickets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Henüz servis kaydı yok</p>
          ) : (
            recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    #{ticket.id} - {ticket.customer?.name} {ticket.customer?.surname}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {ticket.issue_description || 'Açıklama yok'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${ticket.ticketStatus === 'CLOSED' 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'bg-green-100 text-green-700'
                      }
                    `}
                  >
                    {ticket.ticketStatus}
                  </span>
                  {ticket.total_price && (
                    <span className="text-sm font-medium text-gray-900">
                      ₺{ticket.total_price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
