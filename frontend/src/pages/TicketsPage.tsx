import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI, customerAPI, settingsAPI, whatsappAPI, productAPI } from '../api';
import type { Ticket, Customer, ProductType, Shelf, Product } from '../types';
import {
  Plus, Search, X, Clock, Check, ChevronRight, Send, Printer,
  Package, Calendar, XCircle, Archive, Pencil, Save, RotateCcw,
  ChevronDown, Trash2, Unlock, AlertTriangle,
} from 'lucide-react';
import Barcode from 'react-barcode';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../components/ui/Toast';

const ticketStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: 'Açık', color: 'bg-yellow-500', icon: Clock },
  CLOSED: { label: 'Kapatıldı', color: 'bg-green-500', icon: Check },
  CANCELLED: { label: 'İptal', color: 'bg-red-500', icon: XCircle },
};

const productStatusConfig: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: 'Teslim Alındı', color: 'bg-yellow-500' },
  IN_REPAIR: { label: 'Tamirde', color: 'bg-blue-500' },
  WAITING_PARTS: { label: 'Parça Bekleniyor', color: 'bg-orange-500' },
  COMPLETED: { label: 'Tamamlandı', color: 'bg-green-500' },
  DELIVERED: { label: 'Teslim Edildi', color: 'bg-teal-500' },
  CANCELLED: { label: 'İptal', color: 'bg-red-500' },
};

export const TicketsPage = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState<Product | null>(null);
  const [showBulkBarcodeModal, setShowBulkBarcodeModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editIssue, setEditIssue] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductForm, setEditProductForm] = useState<{
    status: string; price: string; description: string; shelfId: string; brand: string; model: string;
  }>({ status: '', price: '', description: '', shelfId: '', brand: '', model: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductForm, setAddProductForm] = useState<{
    productTypeId: string; shelfId: string; brand: string; model: string; description: string;
  }>({ productTypeId: '', shelfId: '', brand: '', model: '', description: '' });
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void; color?: string } | null>(null);

  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: ['tickets', currentPage],
    queryFn: async () => (await ticketAPI.getAll(currentPage, 50)).data,
  });

  const tickets = ticketsResponse?.data || [];
  const meta = ticketsResponse?.meta || { total: 0, page: 1, limit: 50, totalPages: 1, hasMore: false };

  const { data: shelves = [] } = useQuery<Shelf[]>({
    queryKey: ['shelves'],
    queryFn: async () => (await settingsAPI.getShelves()).data,
  });

  const { data: productTypes = [] } = useQuery<ProductType[]>({
    queryKey: ['productTypes'],
    queryFn: async () => (await settingsAPI.getProductTypes()).data,
  });

  const { toast } = useToast();

  const closeMutation = useMutation({
    mutationFn: ({ id, total_price }: { id: number; total_price: number }) =>
      ticketAPI.close(id, { total_price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowCloseModal(false);
      setSelectedTicket(null);
      toast('Servis kapatıldı', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast(msg || 'Servis kapatılamadı.', 'error');
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ticketAPI.update(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(res.data);
      setEditMode(false);
      toast('Servis güncellendi', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Güncelleme başarısız.', 'error');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setEditingProductId(null);
      toast('Ürün güncellendi', 'success');
      // Refresh selected ticket
      if (selectedTicket) {
        ticketAPI.getById(selectedTicket.id).then((res) => {
          setSelectedTicket(res.data);
        });
      }
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Ürün güncellenemedi.', 'error');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => productAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast('Ürün silindi', 'success');
      if (selectedTicket) {
        ticketAPI.getById(selectedTicket.id).then((res) => {
          setSelectedTicket(res.data);
        });
      }
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Ürün silinemedi.', 'error');
    },
  });

  const addProductMutation = useMutation({
    mutationFn: (data: { productTypeId: number; shelfId: number; model: string; brand: string; description?: string | null }) =>
      ticketAPI.addProduct(selectedTicket!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast('Ürün eklendi', 'success');
      setShowAddProduct(false);
      setAddProductForm({ productTypeId: '', shelfId: '', brand: '', model: '', description: '' });
      if (selectedTicket) {
        ticketAPI.getById(selectedTicket.id).then((res) => {
          setSelectedTicket(res.data);
        });
      }
    },
    onError: (err: any) => {
      toast(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Ürün eklenemedi.', 'error');
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (id: number) => ticketAPI.reopen(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(res.data);
      toast('Servis yeniden açıldı', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'İşlem başarısız.', 'error');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => ticketAPI.cancel(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(res.data);
      toast('Servis iptal edildi', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.error || 'Servis iptal edilemedi.', 'error');
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id: number) => ticketAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(null);
      toast('Servis kaydı silindi', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.error || 'Servis silinemedi.', 'error');
    },
  });

  const filtered = tickets.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.ticketStatus === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      t.customer?.name.toLowerCase().includes(q) ||
      t.customer?.surname.toLowerCase().includes(q) ||
      t.customer?.phone.includes(q) ||
      String(t.id).includes(q) ||
      t.products?.some((p) => p.model.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Ticket Detail View
  if (selectedTicket) {
    const statusCfg = ticketStatusConfig[selectedTicket.ticketStatus] || ticketStatusConfig.OPEN;
    const StatusIcon = statusCfg.icon;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedTicket(null)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white font-sora">Servis #{selectedTicket.id}</h1>
            <p className="text-gray-400">Servis Detayları</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(selectedTicket.ticketStatus === 'OPEN' || selectedTicket.ticketStatus === 'CLOSED') && !editMode && (
              <button
                onClick={() => {
                  setEditMode(true);
                  setEditIssue(selectedTicket.issue_description || '');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden md:inline">Düzenle</span>
              </button>
            )}
            {editMode && (
              <>
                <button
                  onClick={() => {
                    updateTicketMutation.mutate({
                      id: selectedTicket.id,
                      data: { issue_description: editIssue },
                    });
                  }}
                  disabled={updateTicketMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden md:inline">{updateTicketMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditingProductId(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden md:inline">İptal</span>
                </button>
              </>
            )}
            {selectedTicket.ticketStatus === 'CLOSED' && !editMode && (
              <button
                onClick={() => setConfirmDialog({
                  title: 'Servisi Tekrar Aç',
                  message: 'Bu servisi tekrar açmak istediğinize emin misiniz?',
                  color: 'bg-orange-600',
                  onConfirm: () => reopenMutation.mutate(selectedTicket.id),
                })}
                disabled={reopenMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                <span className="hidden md:inline">{reopenMutation.isPending ? 'Açılıyor...' : 'Tekrar Aç'}</span>
              </button>
            )}
            {selectedTicket.ticketStatus === 'OPEN' && (
              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="hidden md:inline">WhatsApp</span>
              </button>
            )}
            {selectedTicket.ticketStatus === 'OPEN' && !editMode && (
              <button
                onClick={() => setConfirmDialog({
                  title: 'Servisi İptal Et',
                  message: 'Bu servisi iptal etmek istediğinize emin misiniz? Tüm ürünler de iptal edilecektir.',
                  color: 'bg-red-600',
                  onConfirm: () => cancelMutation.mutate(selectedTicket.id),
                })}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span className="hidden md:inline">{cancelMutation.isPending ? 'İptal ediliyor...' : 'İptal Et'}</span>
              </button>
            )}
            {selectedTicket.ticketStatus === 'OPEN' && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all"
              >
                <Check className="w-4 h-4" />
                <span className="hidden md:inline">Kapat</span>
              </button>
            )}
            {selectedTicket.products && selectedTicket.products.length > 0 && (
              <button
                onClick={() => setShowBulkBarcodeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">Tüm Barkodlar</span>
              </button>
            )}
            {!editMode && (
              <button
                onClick={() => setConfirmDialog({
                  title: 'Servisi Sil',
                  message: `#${selectedTicket.id} numaralı servis kaydını ve tüm ürünlerini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                  color: 'bg-red-600',
                  onConfirm: () => deleteTicketMutation.mutate(selectedTicket.id),
                })}
                disabled={deleteTicketMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">{deleteTicketMutation.isPending ? 'Siliniyor...' : 'Sil'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* General Info */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Genel Bilgiler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="min-w-0">
                  <p className="text-gray-400 text-sm mb-1">Müşteri</p>
                  <p className="text-white font-medium truncate" title={selectedTicket.customer ? `${selectedTicket.customer.name} ${selectedTicket.customer.surname}` : undefined}>
                    {selectedTicket.customer
                      ? `${selectedTicket.customer.name} ${selectedTicket.customer.surname}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Telefon</p>
                  <p className="text-white font-medium">{selectedTicket.customer?.phone || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-sm mb-1">Açıklama</p>
                  {editMode ? (
                    <textarea
                      value={editIssue}
                      onChange={(e) => setEditIssue(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-900 border border-blue-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Arıza açıklaması..."
                    />
                  ) : (
                    <p className="text-white font-medium">{selectedTicket.issue_description || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Oluşturan</p>
                  <p className="text-white font-medium">{selectedTicket.creator?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Son Güncelleyen</p>
                  <p className="text-white font-medium">{selectedTicket.updater?.name || '-'}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Ürünler</h2>
                {(selectedTicket.ticketStatus === 'OPEN' || selectedTicket.ticketStatus === 'CLOSED') && (
                  <button
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Ürün Ekle
                  </button>
                )}
              </div>

              {/* Add Product Form */}
              {showAddProduct && (
                <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Yeni Ürün Ekle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Ürün Tipi *</label>
                      <CustomSelect
                        options={productTypes.map((pt) => ({
                          value: String(pt.id),
                          label: pt.type,
                        }))}
                        value={addProductForm.productTypeId}
                        onChange={(val) => setAddProductForm({ ...addProductForm, productTypeId: val })}
                        placeholder="Seçin..."
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Raf Konumu *</label>
                      <CustomSelect
                        options={shelves.map((s) => ({
                          value: String(s.id),
                          label: `${s.zone}-${s.row}`,
                        }))}
                        value={addProductForm.shelfId}
                        onChange={(val) => setAddProductForm({ ...addProductForm, shelfId: val })}
                        placeholder="Seçin..."
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Marka</label>
                      <input
                        type="text"
                        value={addProductForm.brand}
                        onChange={(e) => setAddProductForm({ ...addProductForm, brand: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Marka"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Model</label>
                      <input
                        type="text"
                        value={addProductForm.model}
                        onChange={(e) => setAddProductForm({ ...addProductForm, model: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Model"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Not</label>
                      <input
                        type="text"
                        value={addProductForm.description}
                        onChange={(e) => setAddProductForm({ ...addProductForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ürün notu (opsiyonel)"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-3">
                    <button
                      onClick={() => {
                        setShowAddProduct(false);
                        setAddProductForm({ productTypeId: '', shelfId: '', brand: '', model: '', description: '' });
                      }}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-all"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => {
                        if (!addProductForm.productTypeId || !addProductForm.shelfId) {
                          toast('Lütfen zorunlu alanları doldurun', 'error');
                          return;
                        }
                        addProductMutation.mutate({
                          productTypeId: Number(addProductForm.productTypeId),
                          shelfId: Number(addProductForm.shelfId),
                          model: addProductForm.model,
                          brand: addProductForm.brand || 'Bilinmiyor',
                          description: addProductForm.description || null,
                        });
                      }}
                      disabled={addProductMutation.isPending}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {addProductMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                  </div>
                </div>
              )}
              {selectedTicket.products && selectedTicket.products.length > 0 ? (
                <div className="space-y-3">
                  {selectedTicket.products.map((product) => {
                    const pStatus = productStatusConfig[product.status] || productStatusConfig.RECEIVED;
                    const isEditingThis = editingProductId === product.id;
                    return (
                      <div key={product.id} className={`bg-gray-900/50 border rounded-xl p-4 ${isEditingThis ? 'border-blue-500/50' : 'border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">
                            {product.brand ? `${product.brand} ` : ''}{product.model}
                          </p>
                          <div className="flex items-center gap-2">
                            {!isEditingThis && (
                              <>
                                <button
                                  onClick={() => setShowBarcodeModal(product)}
                                  className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-all"
                                  title="Barkod Yazdır"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                {(selectedTicket.ticketStatus === 'OPEN' || selectedTicket.ticketStatus === 'CLOSED') && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingProductId(product.id);
                                        setEditProductForm({
                                          status: product.status,
                                          price: product.price ? String(Number(product.price)) : '',
                                          description: product.description || '',
                                          shelfId: String(product.shelfId),
                                          brand: product.brand || '',
                                          model: product.model,
                                        });
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-all"
                                      title="Düzenle"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDialog({
                                        title: 'Ürünü Sil',
                                        message: 'Bu ürünü silmek istediğinize emin misiniz?',
                                        color: 'bg-red-600',
                                        onConfirm: () => deleteProductMutation.mutate(product.id),
                                      })}
                                      disabled={deleteProductMutation.isPending}
                                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
                                      title="Sil"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            <span className={`${pStatus.color} text-white text-xs px-3 py-1 rounded-full`}>
                              {pStatus.label}
                            </span>
                          </div>
                        </div>

                        {/* Quick status buttons (non-edit mode) */}
                        {!isEditingThis && (selectedTicket.ticketStatus === 'OPEN' || selectedTicket.ticketStatus === 'CLOSED') && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {Object.entries(productStatusConfig).map(([key, cfg]) => (
                              <button
                                key={key}
                                onClick={() => {
                                  if (key !== product.status) {
                                    updateProductMutation.mutate({ id: product.id, data: { status: key } });
                                  }
                                }}
                                disabled={updateProductMutation.isPending}
                                className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
                                  key === product.status
                                    ? `${cfg.color} text-white`
                                    : 'bg-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {isEditingThis ? (
                          <div className="space-y-3 mt-3 pt-3 border-t border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Marka</label>
                                <input
                                  type="text"
                                  value={editProductForm.brand}
                                  onChange={(e) => setEditProductForm({ ...editProductForm, brand: e.target.value })}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Marka..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Model</label>
                                <input
                                  type="text"
                                  value={editProductForm.model}
                                  onChange={(e) => setEditProductForm({ ...editProductForm, model: e.target.value })}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Model..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Durum</label>
                                <CustomSelect
                                  options={Object.entries(productStatusConfig).map(([key, cfg]) => ({
                                    value: key,
                                    label: cfg.label,
                                  }))}
                                  value={editProductForm.status}
                                  onChange={(val) => setEditProductForm({ ...editProductForm, status: val })}
                                  placeholder="Durum seçin..."
                                  size="sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Fiyat (₺)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editProductForm.price}
                                  onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Raf Konumu</label>
                                <CustomSelect
                                  options={shelves.map((s) => ({
                                    value: String(s.id),
                                    label: `${s.zone}-${s.row}`,
                                  }))}
                                  value={editProductForm.shelfId}
                                  onChange={(val) => setEditProductForm({ ...editProductForm, shelfId: val })}
                                  placeholder="Raf seçin..."
                                  size="sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Not</label>
                                <input
                                  type="text"
                                  value={editProductForm.description}
                                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Ürün notu..."
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-all"
                              >
                                İptal
                              </button>
                              <button
                                onClick={() => {
                                  const data: any = { status: editProductForm.status };
                                  if (editProductForm.price) data.price = Number(editProductForm.price);
                                  if (editProductForm.shelfId) data.shelfId = Number(editProductForm.shelfId);
                                  if (editProductForm.description !== undefined) data.description = editProductForm.description;
                                  if (editProductForm.brand !== undefined) data.brand = editProductForm.brand;
                                  if (editProductForm.model) data.model = editProductForm.model;
                                  updateProductMutation.mutate({ id: product.id, data });
                                }}
                                disabled={updateProductMutation.isPending}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                              >
                                {updateProductMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              {product.shelf && (
                                <span className="flex items-center gap-1">
                                  <Archive className="w-3 h-3" />
                                  {product.shelf.zone}-{product.shelf.row}
                                </span>
                              )}
                              {product.productType && <span>{product.productType.type}</span>}
                              {product.price && <span className="text-blue-500 font-medium">₺{Number(product.price)}</span>}
                            </div>
                            {product.description && (
                              <p className="text-gray-500 text-sm mt-2">{product.description}</p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">Ürün bulunmuyor</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Toplam Tutar</p>
              <p className="text-4xl font-bold mb-4">
                {(() => {
                  const calcTotal = selectedTicket.products?.reduce((sum, p) => sum + (p.price ? Number(p.price) : 0), 0) || 0;
                  const displayTotal = selectedTicket.total_price ? Number(selectedTicket.total_price) : calcTotal;
                  return displayTotal > 0 ? `₺${displayTotal}` : '—';
                })()}
              </p>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Calendar className="w-4 h-4" />
                <span>{new Date(selectedTicket.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Durum</h3>
              <div className={`flex items-center gap-3 p-3 ${statusCfg.color} rounded-xl`}>
                <StatusIcon className="w-5 h-5 text-white" />
                <span className="text-white font-medium">{statusCfg.label}</span>
              </div>
              {selectedTicket.closed_at && (
                <p className="text-gray-500 text-sm mt-3">
                  Kapanma: {new Date(selectedTicket.closed_at).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Modal */}
        {showWhatsAppModal && selectedTicket.customer && (
          <WhatsAppModal
            customer={selectedTicket.customer}
            ticket={selectedTicket}
            onClose={() => setShowWhatsAppModal(false)}
          />
        )}

        {/* Close Ticket Modal */}
        {showCloseModal && (
          <CloseTicketModal
            loading={closeMutation.isPending}
            defaultPrice={selectedTicket.products?.reduce((sum, p) => sum + (p.price ? Number(p.price) : 0), 0) || 0}
            onClose={() => setShowCloseModal(false)}
            onSubmit={(price) => closeMutation.mutate({ id: selectedTicket.id, total_price: price })}
          />
        )}

        {/* Barcode Print Modal */}
        {showBarcodeModal && (
          <BarcodePrintModal
            product={showBarcodeModal}
            ticket={selectedTicket}
            onClose={() => setShowBarcodeModal(null)}
          />
        )}

        {/* Bulk Barcode Print Modal */}
        {showBulkBarcodeModal && selectedTicket.products && (
          <BulkBarcodePrintModal
            products={selectedTicket.products}
            ticket={selectedTicket}
            onClose={() => setShowBulkBarcodeModal(false)}
          />
        )}

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmDialog(null)}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${confirmDialog.color || 'bg-red-600'} bg-opacity-20`}>
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
              </div>
              <p className="text-gray-300 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-all"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className={`px-4 py-2 ${confirmDialog.color || 'bg-red-600'} hover:opacity-90 text-white rounded-xl transition-all`}
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tickets List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 font-sora">Servisler</h1>
          <p className="text-gray-400">{filtered.length} servis bulundu</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          Yeni Servis
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Müşteri, cihaz veya servis numarası ara..."
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filterStatus === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tümü ({tickets.length})
          </button>
          {Object.entries(ticketStatusConfig).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === status ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {config.label} ({tickets.filter((t) => t.ticketStatus === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-20 h-20 text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Servis Bulunamadı</h2>
          <p className="text-gray-400">Arama kriterlerinize uygun servis yok</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((ticket) => {
            const statusCfg = ticketStatusConfig[ticket.ticketStatus] || ticketStatusConfig.OPEN;
            const StatusIcon = statusCfg.icon;
            const firstProduct = ticket.products?.[0];
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${statusCfg.color} rounded-xl flex items-center justify-center`}>
                      <StatusIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold">#{ticket.id}</p>
                      <p className="text-xs font-medium text-gray-400">{statusCfg.label}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="space-y-3">
                  <div className="min-w-0">
                    <p className="text-gray-400 text-xs mb-1">Müşteri</p>
                    <p className="text-white font-medium truncate" title={ticket.customer ? `${ticket.customer.name} ${ticket.customer.surname}` : undefined}>
                      {ticket.customer
                        ? `${ticket.customer.name} ${ticket.customer.surname}`
                        : `Müşteri #${ticket.customerId}`}
                    </p>
                    {ticket.customer && (
                      <p className="text-gray-500 text-sm">{ticket.customer.phone}</p>
                    )}
                  </div>

                  {firstProduct && (
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Cihaz</p>
                      <p className="text-white font-medium">
                        {firstProduct.brand ? `${firstProduct.brand} ` : ''}{firstProduct.model}
                      </p>
                      {ticket.products && ticket.products.length > 1 && (
                        <p className="text-gray-500 text-sm">+{ticket.products.length - 1} diğer ürün</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <div className="text-gray-400 text-sm">
                      {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                    </div>
                    {ticket.total_price && (
                      <div className="text-blue-500 font-bold">₺{Number(ticket.total_price)}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">
            Sayfa {meta.page} / {meta.totalPages} • Toplam {meta.total} servis
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={meta.page === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                let pageNum;
                if (meta.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (meta.page <= 3) {
                  pageNum = i + 1;
                } else if (meta.page >= meta.totalPages - 2) {
                  pageNum = meta.totalPages - 4 + i;
                } else {
                  pageNum = meta.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-all ${
                      meta.page === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page === meta.totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewModal && (
        <NewTicketModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
};

/* ==================== New Ticket Modal ==================== */
function NewTicketModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [products, setProducts] = useState<{ id: string; productTypeId: string; shelfId: string; brand: string; model: string; description: string }[]>([
    { id: crypto.randomUUID(), productTypeId: '', shelfId: '', brand: '', model: '', description: '' },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => (await customerAPI.getAll()).data,
  });

  const { data: productTypes = [] } = useQuery<ProductType[]>({
    queryKey: ['productTypes'],
    queryFn: async () => (await settingsAPI.getProductTypes()).data,
  });

  const { data: shelves = [] } = useQuery<Shelf[]>({
    queryKey: ['shelves'],
    queryFn: async () => (await settingsAPI.getShelves()).data,
  });

  const addProduct = () => {
    setProducts([...products, { id: crypto.randomUUID(), productTypeId: '', shelfId: '', brand: '', model: '', description: '' }]);
  };

  const removeProduct = (id: string) => {
    if (products.length <= 1) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, field: string, value: string) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = async () => {
    if (!customerId) {
      setError('Lütfen müşteri seçin');
      return;
    }
    for (const p of products) {
      if (!p.productTypeId || !p.shelfId) {
        setError('Lütfen tüm ürünlerin zorunlu alanlarını doldurun');
        return;
      }
    }
    setLoading(true);
    setError('');
    try {
      await ticketAPI.create({
        customerId,
        issue_description: issueDescription || null,
        products: products.map((p) => ({
          productTypeId: Number(p.productTypeId),
          shelfId: Number(p.shelfId),
          brand: p.brand || 'Bilinmiyor',
          model: p.model,
          description: p.description || null,
        })),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white font-sora">Yeni Servis Kaydı</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-700'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'}`} />
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">1. Müşteri Seçin</h3>
              <CustomSelect
                options={customers.map((c) => ({
                  value: String(c.id),
                  label: `${c.name} ${c.surname}`,
                  sublabel: c.phone,
                }))}
                value={customerId ? String(customerId) : ''}
                onChange={(val) => setCustomerId(Number(val))}
                placeholder="Müşteri seçin..."
                searchable
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Arıza Açıklaması</label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Arıza açıklaması (opsiyonel)"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!customerId) {
                      setError('Lütfen müşteri seçin');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Devam →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">2. Ürün Bilgileri</h3>
                <button
                  type="button"
                  onClick={addProduct}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Ürün Ekle
                </button>
              </div>

              <div className="space-y-4">
                {products.map((product, index) => (
                  <div key={product.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">Ürün {index + 1}</span>
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Ürünü Kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Ürün Tipi *</label>
                        <CustomSelect
                          options={productTypes.map((pt) => ({
                            value: String(pt.id),
                            label: pt.type,
                          }))}
                          value={product.productTypeId}
                          onChange={(val) => updateProduct(product.id, 'productTypeId', val)}
                          placeholder="Seçin..."
                          size="sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Raf Konumu *</label>
                        <CustomSelect
                          options={shelves.map((s) => ({
                            value: String(s.id),
                            label: `${s.zone}-${s.row}`,
                          }))}
                          value={product.shelfId}
                          onChange={(val) => updateProduct(product.id, 'shelfId', val)}
                          placeholder="Seçin..."
                          size="sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Marka</label>
                        <input
                          type="text"
                          value={product.brand}
                          onChange={(e) => updateProduct(product.id, 'brand', e.target.value)}
                          className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Marka"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Model</label>
                        <input
                          type="text"
                          value={product.model}
                          onChange={(e) => updateProduct(product.id, 'model', e.target.value)}
                          className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Model"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Ürün Notu</label>
                      <input
                        type="text"
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ek not (opsiyonel)"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
                >
                  ← Geri
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : `Servis Oluştur (${products.length} Ürün)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== WhatsApp Modal ==================== */
function WhatsAppModal({
  customer,
  ticket,
  onClose,
}: {
  customer: Customer;
  ticket: Ticket;
  onClose: () => void;
}) {
  const [messageType, setMessageType] = useState('in-progress');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const firstProduct = ticket.products?.[0];
  const deviceName = firstProduct
    ? `${firstProduct.brand || ''} ${firstProduct.model || ''}`.trim() || 'cihazınız'
    : 'cihazınız';

  const templates: Record<string, string> = {
    'in-progress': `Sayın ${customer.name} ${customer.surname},\n\n${deviceName} cihazınız tamir aşamasındadır. En kısa sürede bilgilendirme yapılacaktır.\n\nTeşekkürler.`,
    completed: `Sayın ${customer.name} ${customer.surname},\n\n${deviceName} cihazınızın tamiri tamamlanmıştır. Gelip alabilirsiniz.\n\n${ticket.total_price ? `Toplam Tutar: ₺${Number(ticket.total_price)}` : ''}\n\nTeşekkürler.`,
    'waiting-parts': `Sayın ${customer.name} ${customer.surname},\n\n${deviceName} cihazınız için yedek parça beklenilmektedir. Parça geldikten sonra tamir işlemine başlanacaktır.\n\nTeşekkürler.`,
    custom: customMessage,
  };

  const handleSend = async () => {
    const message = templates[messageType];
    if (!message) return;

    setSending(true);
    setResult(null);
    try {
      await whatsappAPI.sendMessage({ to: customer.phone, message });
      setResult({ success: true, message: 'Mesaj gönderildi!' });
      setTimeout(onClose, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setResult({ success: false, message: msg || 'Mesaj gönderilemedi. WhatsApp bağlantısını kontrol edin.' });
    } finally {
      setSending(false);
    }
  };

  const templateOptions = [
    { key: 'in-progress', label: 'Tamir Aşamasında', desc: 'Cihazın tamir edildiğini bildir' },
    { key: 'completed', label: 'Tamir Tamamlandı', desc: 'Cihazın hazır olduğunu bildir' },
    { key: 'waiting-parts', label: 'Parça Bekleniyor', desc: 'Yedek parça beklendiğini bildir' },
    { key: 'custom', label: 'Özel Mesaj', desc: 'Kendi mesajınızı yazın' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg">
        <div className="bg-green-600 p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-sora">WhatsApp Mesajı</h2>
              <p className="text-green-100 text-sm">{customer.name} {customer.surname}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white hover:bg-green-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {result && (
            <div className={`p-3 rounded-xl text-sm ${result.success ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {result.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Mesaj Şablonu</label>
            <div className="space-y-2">
              {templateOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setMessageType(opt.key)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    messageType === opt.key
                      ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
                      : 'bg-gray-900 border-2 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-xs opacity-75 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mesaj Önizleme</label>
            {messageType === 'custom' ? (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Mesajınızı buraya yazın..."
              />
            ) : (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 whitespace-pre-wrap text-sm">
                {templates[messageType]}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              İptal
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== Close Ticket Modal ==================== */
function CloseTicketModal({
  loading,
  defaultPrice,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  defaultPrice?: number;
  onClose: () => void;
  onSubmit: (price: number) => void;
}) {
  const [price, setPrice] = useState(defaultPrice && defaultPrice > 0 ? String(defaultPrice) : '');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white font-sora">Servisi Kapat</h2>
          <p className="text-gray-400 text-sm mt-1">Toplam tutarı girin ve servisi kapatın</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Toplam Tutar (₺) *</label>
            {defaultPrice != null && defaultPrice > 0 && (
              <p className="text-blue-400 text-xs mb-2">💡 Ürün fiyatlarından hesaplanan: ₺{defaultPrice}</p>
            )}
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              İptal
            </button>
            <button
              onClick={() => {
                if (price) onSubmit(Number(price));
              }}
              disabled={loading || !price}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Kapatılıyor...' : 'Kapat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== Barcode Print Modal ==================== */
function BarcodePrintModal({
  product,
  ticket,
  onClose,
}: {
  product: Product;
  ticket: Ticket;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const barcodeValue = `SRV-${String(ticket.id).padStart(5, '0')}-${String(product.id).padStart(5, '0')}`;
  const customerName = ticket.customer
    ? `${ticket.customer.name} ${ticket.customer.surname}`
    : '-';
  const deviceName = `${product.brand || ''} ${product.model || ''}`.trim() || '-';
  const dateStr = new Date(product.receivedDate || ticket.created_at).toLocaleDateString('tr-TR');
  const shelfLabel = product.shelf ? `${product.shelf.zone}-${product.shelf.row}` : '-';
  const productTypeName = product.productType?.type || '-';

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barkod - ${barcodeValue}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          @media print {
            @page {
              size: 40mm 100mm;
              margin: 2mm;
            }
          }
          .label {
            width: 36mm;
            padding: 2mm;
            border: 1px solid #333;
            border-radius: 2mm;
          }
          .header {
            text-align: center;
            font-weight: bold;
            font-size: 9pt;
            border-bottom: 1px solid #ccc;
            padding-bottom: 1mm;
            margin-bottom: 1mm;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            margin-bottom: 0.5mm;
          }
          .info-label {
            color: #555;
            font-weight: 600;
          }
          .info-value {
            font-weight: bold;
          }
          .barcode-container {
            text-align: center;
            margin: 1mm 0;
          }
          .barcode-container svg {
            max-width: 100%;
            height: auto;
          }
          .footer {
            text-align: center;
            font-size: 6pt;
            color: #888;
            margin-top: 1mm;
            border-top: 1px solid #eee;
            padding-top: 1mm;
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-sora">Barkod Yazdır</h2>
            <p className="text-gray-400 text-sm mt-1">Ürün etiketi önizleme</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Preview */}
          <div className="bg-white rounded-xl p-5 mb-6 shadow-lg">
            <div ref={printRef}>
              <div className="label">
                <div className="header">Demir Teknik Servis</div>
                <div className="info-row">
                  <span className="info-label">Müşteri:</span>
                  <span className="info-value">{customerName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Cihaz:</span>
                  <span className="info-value">{deviceName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Tip:</span>
                  <span className="info-value">{productTypeName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Raf:</span>
                  <span className="info-value">{shelfLabel}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Tarih:</span>
                  <span className="info-value">{dateStr}</span>
                </div>
                <div className="barcode-container">
                  <Barcode
                    value={barcodeValue}
                    format="CODE128"
                    width={1}
                    height={30}
                    fontSize={8}
                    margin={1}
                    displayValue={true}
                  />
                </div>
                <div className="footer">Servis #{ticket.id} • Ürün #{product.id}</div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Barkod Kodu:</span>
              <span className="text-white font-mono font-medium">{barcodeValue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Etiket Boyutu:</span>
              <span className="text-white">40mm × 100mm</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              Kapat
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Yazdır
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== Bulk Barcode Print Modal ==================== */
function BulkBarcodePrintModal({
  products,
  ticket,
  onClose,
}: {
  products: Product[];
  ticket: Ticket;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const customerName = ticket.customer
    ? `${ticket.customer.name} ${ticket.customer.surname}`
    : '-';

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tüm Barkodlar - Servis #${ticket.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          @media print {
            @page {
              size: 40mm 100mm;
              margin: 2mm;
            }
          }
          .label {
            width: 36mm;
            padding: 2mm;
            border: 1px solid #333;
            border-radius: 2mm;
            page-break-after: always;
          }
          .label:last-child {
            page-break-after: auto;
          }
          .header {
            text-align: center;
            font-weight: bold;
            font-size: 9pt;
            border-bottom: 1px solid #ccc;
            padding-bottom: 1mm;
            margin-bottom: 1mm;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            margin-bottom: 0.5mm;
          }
          .info-label { color: #555; font-weight: 600; }
          .info-value { font-weight: bold; }
          .barcode-container {
            text-align: center;
            margin: 1mm 0;
          }
          .barcode-container svg {
            max-width: 100%;
            height: auto;
          }
          .footer {
            text-align: center;
            font-size: 6pt;
            color: #888;
            margin-top: 1mm;
            border-top: 1px solid #eee;
            padding-top: 1mm;
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white font-sora">Tüm Barkodları Yazdır</h2>
            <p className="text-gray-400 text-sm mt-1">{products.length} ürün etiketi</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Preview */}
          <div className="bg-white rounded-xl p-5 mb-6 shadow-lg space-y-4">
            <div ref={printRef}>
              {products.map((product) => {
                const barcodeValue = `SRV-${String(ticket.id).padStart(5, '0')}-${String(product.id).padStart(5, '0')}`;
                const deviceName = `${product.brand || ''} ${product.model || ''}`.trim() || '-';
                const dateStr = new Date(product.receivedDate || ticket.created_at).toLocaleDateString('tr-TR');
                const shelfLabel = product.shelf ? `${product.shelf.zone}-${product.shelf.row}` : '-';
                const productTypeName = product.productType?.type || '-';
                return (
                  <div key={product.id} className="label">
                    <div className="header">Demir Teknik Servis</div>
                    <div className="info-row">
                      <span className="info-label">Müşteri:</span>
                      <span className="info-value">{customerName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Cihaz:</span>
                      <span className="info-value">{deviceName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Tip:</span>
                      <span className="info-value">{productTypeName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Raf:</span>
                      <span className="info-value">{shelfLabel}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Tarih:</span>
                      <span className="info-value">{dateStr}</span>
                    </div>
                    <div className="barcode-container">
                      <Barcode
                        value={barcodeValue}
                        format="CODE128"
                        width={1}
                        height={30}
                        fontSize={8}
                        margin={1}
                        displayValue={true}
                      />
                    </div>
                    <div className="footer">Servis #{ticket.id} • Ürün #{product.id}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Toplam Etiket:</span>
              <span className="text-white font-medium">{products.length} adet</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Etiket Boyutu:</span>
              <span className="text-white">40mm × 100mm</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              Kapat
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Tümünü Yazdır
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
