import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerAPI } from '../api';
import type { Customer } from '../types';
import { Plus, Search, X, Phone, MapPin, Edit2, Users } from 'lucide-react';

export const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => (await customerAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; surname: string; phone: string; address?: string }) =>
      customerAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      customerAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowModal(false);
      setEditCustomer(null);
    },
  });

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.surname.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditCustomer(null);
    setShowModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setShowModal(true);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-white mb-1 font-sora">Müşteriler</h1>
          <p className="text-gray-400">{customers.length} müşteri kayıtlı</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          Yeni Müşteri
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="İsim, soyisim veya telefon ara..."
          className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Customer Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-20 h-20 text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Müşteri Bulunamadı</h2>
          <p className="text-gray-400">Arama kriterlerinize uygun müşteri yok</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <div
              key={customer.id}
              className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {customer.name.charAt(0)}
                </div>
                <button
                  onClick={() => handleOpenEdit(customer)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-700 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-white font-bold text-lg mb-1 truncate" title={`${customer.name} ${customer.surname}`}>
                {customer.name} {customer.surname}
              </h3>

              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700">
                <p className="text-gray-500 text-xs">
                  Kayıt: {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CustomerModal
          customer={editCustomer}
          loading={createMutation.isPending || updateMutation.isPending}
          error={
            (createMutation.error as any)?.response?.data?.errors?.[0] ||
            (updateMutation.error as any)?.response?.data?.errors?.[0] ||
            (createMutation.error as any)?.response?.data?.error ||
            (updateMutation.error as any)?.response?.data?.error ||
            ''
          }
          onClose={() => {
            setShowModal(false);
            setEditCustomer(null);
            createMutation.reset();
            updateMutation.reset();
          }}
          onSubmit={(data) => {
            if (editCustomer) {
              updateMutation.mutate({ id: editCustomer.id, data });
            } else {
              createMutation.mutate(data as any);
            }
          }}
        />
      )}
    </div>
  );
};

/* Customer Create/Edit Modal */
function CustomerModal({
  customer,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  customer: Customer | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (data: { name: string; surname: string; phone: string; address?: string }) => void;
}) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    surname: customer?.surname || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      surname: form.surname,
      phone: form.phone,
      address: form.address || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg">
        <div className="p-6 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white font-sora">
            {customer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ad *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ad"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Soyad *</label>
              <input
                type="text"
                required
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Soyad"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="05XX XXX XX XX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Adres</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adres (opsiyonel)"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : customer ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
