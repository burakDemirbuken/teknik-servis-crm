import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerAPI } from '../lib/api';
import type { Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

export const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    address: '',
  });
  const [formError, setFormError] = useState('');

  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customerAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: customerAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      setFormData({ name: '', surname: '', phone: '', address: '' });
      setFormError('');
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.error || 'Müşteri eklenirken hata oluştu');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.surname || !formData.phone) {
      setFormError('Lütfen tüm gerekli alanları doldurun');
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredCustomers = customers?.filter((customer) => {
    const search = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.surname.toLowerCase().includes(search) ||
      customer.phone.includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-gray-600 mt-1">Müşteri yönetimi</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Yeni Müşteri
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Müşteri ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredCustomers?.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Müşteri bulunamadı</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Ad Soyad</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Telefon</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Adres</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers?.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {customer.name} {customer.surname}
                      </div>
                      {customer.creator && (
                        <div className="text-xs text-gray-500">
                          Ekleyen: {customer.creator.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{customer.phone}</td>
                    <td className="py-3 px-4 text-gray-700">{customer.address || '-'}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {format(new Date(customer.created_at), 'dd.MM.yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormError('');
        }}
        title="Yeni Müşteri Ekle"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
              Ekle
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          <Input
            label="Ad *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ahmet"
            required
          />

          <Input
            label="Soyad *"
            value={formData.surname}
            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            placeholder="Yılmaz"
            required
          />

          <Input
            label="Telefon *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="555-0123"
            required
          />

          <Input
            label="Adres"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="İstanbul"
          />
        </form>
      </Modal>
    </div>
  );
};
