import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, whatsappAPI } from '../api';
import type { ProductType, Shelf, WhatsAppStatus } from '../types';
import {
  Plus, X, Settings, Wifi, WifiOff, Send, Package, Archive, Loader, RefreshCw, Trash2, Pencil, Check,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useToast } from '../components/ui/Toast';

export const SettingsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 font-sora">Ayarlar</h1>
        <p className="text-gray-400">Sistem ayarlarını yönetin</p>
      </div>

      <WhatsAppSection />
      <ProductTypesSection />
      <ShelvesSection />
    </div>
  );
};

/* ==================== WhatsApp Section ==================== */
function WhatsAppSection() {
  const { data: status, refetch } = useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp-status'],
    queryFn: async () => (await whatsappAPI.getStatus()).data,
    refetchInterval: (query) => {
      const data = query.state.data as WhatsAppStatus | undefined;
      // QR bekliyorken veya bağlanırken daha sık polling yap
      if (data?.isInitializing && !data?.qrCode) return 1500;
      if (data?.isInitializing && data?.qrCode) return 3000;
      return 5000;
    },
  });

  const connectMutation = useMutation({
    mutationFn: () => whatsappAPI.connect(),
    onSuccess: () => {
      // Hemen refetch et, QR'ı yakala
      setTimeout(() => refetch(), 500);
      setTimeout(() => refetch(), 2000);
      setTimeout(() => refetch(), 4000);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => whatsappAPI.disconnect(),
    onSuccess: () => refetch(),
  });

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
          <Send className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">WhatsApp</h2>
          <p className="text-gray-400 text-sm">WhatsApp bağlantı durumu</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
          status?.isReady
            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
            : status?.isInitializing
            ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
            : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {status?.isReady ? (
            <Wifi className="w-4 h-4" />
          ) : status?.isInitializing ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="font-medium text-sm">
            {status?.isReady ? 'Bağlı' : status?.isInitializing ? 'Bağlanıyor...' : 'Bağlı Değil'}
          </span>
        </div>

        <div className="flex gap-2">
          {!status?.isReady && !status?.isInitializing && (
            <button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              Bağlan
            </button>
          )}
          {(status?.isReady || status?.isInitializing) && (
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              Bağlantıyı Kes
            </button>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      {status?.isInitializing && !status?.qrCode && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 text-yellow-400">
            <Loader className="w-5 h-5 animate-spin" />
            <p className="text-sm font-medium">WhatsApp başlatılıyor, QR kodu bekleniyor...</p>
          </div>
          <p className="text-gray-500 text-xs mt-2">Bu işlem birkaç saniye sürebilir</p>
        </div>
      )}

      {status?.qrCode && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-300 text-sm">
              📱 QR kodu telefonunuzun <span className="text-white font-medium">WhatsApp → Bağlı Cihazlar → Cihaz Bağla</span> bölümünden tarayın
            </p>
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <QRCode
                value={status.qrCode}
                size={220}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          </div>
          <p className="text-gray-500 text-xs text-center mt-3">QR kod otomatik olarak yenilenir • Süre dolduğunda yeni QR oluşturulur</p>
        </div>
      )}

      {status?.isReady && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 text-sm font-medium">✅ WhatsApp başarıyla bağlandı! Artık mesaj gönderebilirsiniz.</p>
        </div>
      )}
    </div>
  );
}

/* ==================== Product Types Section ==================== */
function ProductTypesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: types = [] } = useQuery<ProductType[]>({
    queryKey: ['productTypes'],
    queryFn: async () => (await settingsAPI.getProductTypes()).data,
  });

  const createMutation = useMutation({
    mutationFn: (type: string) => settingsAPI.createProductType({ type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      setNewType('');
      setShowForm(false);
      toast('Ürün tipi eklendi', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      if (err.response?.status === 409) {
        toast(msg || 'Bu ürün tipi zaten mevcut.', 'warning');
      } else {
        toast(msg || 'Ürün tipi eklenemedi.', 'error');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, type }: { id: number; type: string }) => settingsAPI.updateProductType(id, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      setEditingId(null);
      toast('Ürün tipi güncellendi', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      if (err.response?.status === 409) {
        toast(msg || 'Bu ürün tipi adı zaten kullanılıyor.', 'warning');
      } else {
        toast(msg || 'Güncelleme başarısız.', 'error');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => settingsAPI.deleteProductType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      toast('Ürün tipi silindi', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Silme işlemi başarısız.', 'error');
    },
  });

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Ürün Tipleri</h2>
            <p className="text-gray-400 text-sm">{types.length} tip tanımlı</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Ekle
        </button>
      </div>

      {showForm && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Yeni ürün tipi adı"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newType.trim()) createMutation.mutate(newType.trim());
            }}
          />
          <button
            onClick={() => newType.trim() && createMutation.mutate(newType.trim())}
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {createMutation.isPending ? '...' : 'Kaydet'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <span key={type.id} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 text-sm flex items-center gap-2 group">
            {editingId === type.id ? (
              <>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editValue.trim()) {
                      updateMutation.mutate({ id: type.id, type: editValue.trim() });
                    }
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                  className="bg-gray-800 border border-indigo-500 rounded-lg px-2 py-0.5 text-white text-sm w-24 focus:outline-none"
                />
                <button
                  onClick={() => editValue.trim() && updateMutation.mutate({ id: type.id, type: editValue.trim() })}
                  className="p-0.5 text-green-400 hover:text-green-300"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-0.5 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                {type.type}
                {confirmDeleteId === type.id ? (
                  <>
                    <span className="text-red-400 text-xs">Sil?</span>
                    <button
                      onClick={() => {
                        deleteMutation.mutate(type.id);
                        setConfirmDeleteId(null);
                      }}
                      disabled={deleteMutation.isPending}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-all"
                    >
                      Evet
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-all"
                    >
                      Hayır
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(type.id);
                        setEditValue(type.type);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-400 transition-all"
                      title="Düzenle"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(type.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 text-gray-500 hover:text-red-400 transition-all"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </>
            )}
          </span>
        ))}
        {types.length === 0 && <p className="text-gray-500 text-sm">Henüz ürün tipi tanımlanmadı</p>}
      </div>
    </div>
  );
}

/* ==================== Shelves Section ==================== */
function ShelvesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [zone, setZone] = useState('');
  const [row, setRow] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editZone, setEditZone] = useState('');
  const [editRow, setEditRow] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: shelves = [] } = useQuery<Shelf[]>({
    queryKey: ['shelves'],
    queryFn: async () => (await settingsAPI.getShelves()).data,
  });

  const createMutation = useMutation({
    mutationFn: () => settingsAPI.createShelf({ zone: zone.toUpperCase(), row: Number(row) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      setZone('');
      setRow('');
      setShowForm(false);
      toast('Raf eklendi', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      if (err.response?.status === 409) {
        toast(msg || 'Bu raf zaten mevcut.', 'warning');
      } else {
        toast(msg || 'Raf eklenemedi.', 'error');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, zone, row }: { id: number; zone: string; row: number }) =>
      settingsAPI.updateShelf(id, { zone, row }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      setEditingId(null);
      toast('Raf güncellendi', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      if (err.response?.status === 409) {
        toast(msg || 'Bu raf adı zaten mevcut.', 'warning');
      } else {
        toast(msg || 'Güncelleme başarısız.', 'error');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => settingsAPI.deleteShelf(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      toast('Raf silindi', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Silme işlemi başarısız.', 'error');
    },
  });

  // Group shelves by zone
  const grouped = shelves.reduce<Record<string, Shelf[]>>((acc, shelf) => {
    (acc[shelf.zone] = acc[shelf.zone] || []).push(shelf);
    return acc;
  }, {});

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
            <Archive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Raf Sistemi</h2>
            <p className="text-gray-400 text-sm">{shelves.length} raf tanımlı</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Ekle
        </button>
      </div>

      {showForm && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            maxLength={2}
            className="w-24 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
            placeholder="Bölge"
          />
          <input
            type="number"
            value={row}
            onChange={(e) => setRow(e.target.value)}
            min="1"
            className="w-24 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Sıra"
          />
          <button
            onClick={() => zone && row && createMutation.mutate()}
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {createMutation.isPending ? '...' : 'Kaydet'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(grouped).map(([zoneName, zShelves]) => (
          <div key={zoneName} className="flex items-center gap-3">
            <span className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 font-bold text-lg">
              {zoneName}
            </span>
            <div className="flex flex-wrap gap-2">
              {zShelves
                .sort((a, b) => a.row - b.row)
                .map((shelf) =>
                  editingId === shelf.id ? (
                    <span key={shelf.id} className="flex items-center gap-1 px-2 py-1 bg-gray-900 border border-cyan-500 rounded-lg">
                      <input
                        type="text"
                        value={editZone}
                        onChange={(e) => setEditZone(e.target.value)}
                        maxLength={2}
                        className="w-12 bg-transparent text-white text-sm focus:outline-none uppercase"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        value={editRow}
                        onChange={(e) => setEditRow(e.target.value)}
                        min="1"
                        className="w-12 bg-transparent text-white text-sm focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editZone && editRow) {
                            updateMutation.mutate({ id: shelf.id, zone: editZone.toUpperCase(), row: Number(editRow) });
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                      />
                      <button
                        onClick={() => editZone && editRow && updateMutation.mutate({ id: shelf.id, zone: editZone.toUpperCase(), row: Number(editRow) })}
                        className="p-0.5 text-cyan-400 hover:text-cyan-300"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-0.5 text-gray-500 hover:text-gray-300">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : (
                    <span key={shelf.id} className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm flex items-center gap-1.5 group">
                      {shelf.zone}-{shelf.row}
                      <button
                        onClick={() => {
                          setEditingId(shelf.id);
                          setEditZone(shelf.zone);
                          setEditRow(String(shelf.row));
                        }}
                        className="p-1 text-gray-500 hover:text-cyan-400 transition-all"
                        title="Düzenle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === shelf.id ? (
                        <>
                          <span className="text-red-400 text-xs">Sil?</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(shelf.id, { onSettled: () => setConfirmDeleteId(null) });
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1 text-green-400 hover:text-green-300 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="p-1 text-gray-400 hover:text-gray-200 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(shelf.id); }}
                          disabled={deleteMutation.isPending}
                          className="p-1 text-gray-500 hover:text-red-400 transition-all"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  )
                )}
            </div>
          </div>
        ))}
        {shelves.length === 0 && <p className="text-gray-500 text-sm">Henüz raf tanımlanmadı</p>}
      </div>
    </div>
  );
}
