import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI, customerAPI, settingsAPI } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const TicketsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [closePrice, setClosePrice] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    issue_description: '',
    productTypeId: '',
    shelfId: '',
    model: '',
    brand: '',
    price: '',
  });

  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: ticketAPI.getAll,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerAPI.getAll,
  });

  const { data: productTypes } = useQuery({
    queryKey: ['productTypes'],
    queryFn: settingsAPI.getProductTypes,
  });

  const { data: shelves } = useQuery({
    queryKey: ['shelves'],
    queryFn: settingsAPI.getShelves,
  });

  const createMutation = useMutation({
    mutationFn: ticketAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsModalOpen(false);
      setFormData({
        customerId: '',
        issue_description: '',
        productTypeId: '',
        shelfId: '',
        model: '',
        brand: '',
        price: '',
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) => ticketAPI.close(id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsCloseModalOpen(false);
      setClosePrice('');
      setSelectedTicket(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      customerId: Number(formData.customerId),
      issue_description: formData.issue_description,
      products: [{
        productTypeId: Number(formData.productTypeId),
        shelfId: Number(formData.shelfId),
        model: formData.model,
        brand: formData.brand,
        price: formData.price ? Number(formData.price) : undefined,
      }],
    });
  };

  const handleClose = () => {
    if (selectedTicket && closePrice) {
      closeMutation.mutate({ id: selectedTicket, price: Number(closePrice) });
    }
  };

  const filteredTickets = tickets?.filter((ticket) => {
    const search = searchQuery.toLowerCase();
    return (
      ticket.customer?.name.toLowerCase().includes(search) ||
      ticket.customer?.surname.toLowerCase().includes(search) ||
      ticket.id.toString().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servisler</h1>
          <p className="text-gray-600 mt-1">Servis kayıtları</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Yeni Servis
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Servis ara..."
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
        ) : filteredTickets?.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Servis bulunamadı</p>
        ) : (
          <div className="space-y-3">
            {filteredTickets?.map((ticket) => (
              <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        #{ticket.id} - {ticket.customer?.name} {ticket.customer?.surname}
                      </h3>
                      <span
                        className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${ticket.ticketStatus === 'CLOSED'
                            ? 'bg-gray-100 text-gray-700'
                            : ticket.ticketStatus === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                          }
                        `}
                      >
                        {ticket.ticketStatus}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {ticket.issue_description || 'Açıklama yok'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{format(new Date(ticket.created_at), 'dd.MM.yyyy HH:mm')}</span>
                      <span>•</span>
                      <span>{ticket.products?.length || 0} ürün</span>
                      {ticket.total_price && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-gray-900">
                            ₺{ticket.total_price.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {ticket.ticketStatus !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedTicket(ticket.id);
                        setIsCloseModalOpen(true);
                      }}
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Kapat
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Servis Kaydı"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
              Oluştur
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              <option value="">Seçiniz</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.surname}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Sorun Açıklaması"
            value={formData.issue_description}
            onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
            placeholder="Ekran kırık"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Tipi *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.productTypeId}
                onChange={(e) => setFormData({ ...formData, productTypeId: e.target.value })}
                required
              >
                <option value="">Seçiniz</option>
                {productTypes?.map((pt) => (
                  <option key={pt.id} value={pt.id}>{pt.type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raf *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.shelfId}
                onChange={(e) => setFormData({ ...formData, shelfId: e.target.value })}
                required
              >
                <option value="">Seçiniz</option>
                {shelves?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.zone}-{s.row}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Model *"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="iPhone 15"
              required
            />

            <Input
              label="Marka *"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Apple"
              required
            />
          </div>

          <Input
            type="number"
            label="Tahmini Fiyat"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="500"
          />
        </form>
      </Modal>

      {/* Close Ticket Modal */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => {
          setIsCloseModalOpen(false);
          setClosePrice('');
          setSelectedTicket(null);
        }}
        title="Servisi Kapat"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCloseModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleClose} isLoading={closeMutation.isPending}>
              Kapat
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">Servisi kapatmak için toplam fiyatı girin:</p>
          <Input
            type="number"
            label="Toplam Fiyat *"
            value={closePrice}
            onChange={(e) => setClosePrice(e.target.value)}
            placeholder="750"
            required
          />
        </div>
      </Modal>
    </div>
  );
};
