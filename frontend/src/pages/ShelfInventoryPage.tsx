import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, productAPI } from '../api';
import type { Product, Shelf } from '../types';
import {
  Archive, Search, Package, ChevronDown, ChevronRight,
  Clock, CheckCircle2, AlertTriangle, Wrench, Box, ArrowRightLeft,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const productStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  RECEIVED: { label: 'Teslim Alındı', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  IN_REPAIR: { label: 'Tamirde', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  WAITING_PARTS: { label: 'Parça Bekleniyor', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  COMPLETED: { label: 'Tamamlandı', color: 'text-green-400', bgColor: 'bg-green-500/20' },
};

interface ShelfWithProducts extends Shelf {
  products: (Product & {
    productType?: { id: number; type: string };
    ticket?: { id: number; customer?: { id: number; name: string; surname: string; phone: string } };
  })[];
}

export const ShelfInventoryPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedShelves, setExpandedShelves] = useState<Set<number>>(new Set());
  const [filterZone, setFilterZone] = useState<string>('all');
  const [movingProductId, setMovingProductId] = useState<number | null>(null);

  const { data: shelves = [], isLoading } = useQuery<ShelfWithProducts[]>({
    queryKey: ['shelf-inventory'],
    queryFn: async () => (await settingsAPI.getShelfInventory()).data,
  });

  const { data: allShelves = [] } = useQuery<Shelf[]>({
    queryKey: ['shelves'],
    queryFn: async () => (await settingsAPI.getShelves()).data,
  });

  const moveProductMutation = useMutation({
    mutationFn: ({ productId, shelfId }: { productId: number; shelfId: number }) =>
      productAPI.update(productId, { shelfId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelf-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setMovingProductId(null);
      toast('Ürün taşındı', 'success');
    },
    onError: () => {
      toast('Ürün taşınamadı', 'error');
    },
  });

  const zones = useMemo(() => {
    const zoneSet = new Set(shelves.map((s) => s.zone));
    return Array.from(zoneSet).sort();
  }, [shelves]);

  const filtered = useMemo(() => {
    return shelves.filter((shelf) => {
      const matchZone = filterZone === 'all' || shelf.zone === filterZone;
      if (!searchQuery) return matchZone;
      const q = searchQuery.toLowerCase();
      const matchShelf = `${shelf.zone}-${shelf.row}`.toLowerCase().includes(q);
      const matchProduct = shelf.products.some(
        (p) =>
          p.model.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.ticket?.customer?.name.toLowerCase().includes(q) ||
          p.ticket?.customer?.surname.toLowerCase().includes(q) ||
          p.productType?.type.toLowerCase().includes(q)
      );
      return matchZone && (matchShelf || matchProduct);
    });
  }, [shelves, searchQuery, filterZone]);

  const totalProducts = useMemo(
    () => filtered.reduce((sum, s) => sum + s.products.length, 0),
    [filtered]
  );

  const toggleShelf = (id: number) => {
    setExpandedShelves((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedShelves(new Set(filtered.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedShelves(new Set());
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
          <h1 className="text-3xl font-bold text-white mb-1 font-sora flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Archive className="w-5 h-5 text-white" />
            </div>
            Raf Envanteri
          </h1>
          <p className="text-gray-400 ml-[52px]">
            {filtered.length} raf, {totalProducts} aktif ürün
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-all"
          >
            Tümünü Aç
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm transition-all"
          >
            Tümünü Kapat
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Raf, ürün, müşteri veya tip ara..."
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setFilterZone('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filterZone === 'all' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tümü
          </button>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setFilterZone(zone)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filterZone === zone ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Bölge {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Summary per zone */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {zones.map((zone) => {
          const zoneShelves = shelves.filter((s) => s.zone === zone);
          const zoneProducts = zoneShelves.reduce((sum, s) => sum + s.products.length, 0);
          return (
            <div
              key={zone}
              onClick={() => setFilterZone(filterZone === zone ? 'all' : zone)}
              className={`bg-gray-800/50 border rounded-xl p-4 cursor-pointer transition-all ${
                filterZone === zone ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <p className="text-2xl font-bold text-white">{zone}</p>
              <p className="text-gray-400 text-sm">{zoneShelves.length} raf</p>
              <p className="text-cyan-400 text-sm font-medium">{zoneProducts} ürün</p>
            </div>
          );
        })}
      </div>

      {/* Shelf List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Archive className="w-20 h-20 text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Raf Bulunamadı</h2>
          <p className="text-gray-400">Arama kriterlerinize uygun raf yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((shelf) => {
            const isExpanded = expandedShelves.has(shelf.id);
            const isEmpty = shelf.products.length === 0;

            return (
              <div
                key={shelf.id}
                className={`bg-gray-800/50 border rounded-2xl overflow-hidden transition-all ${
                  isEmpty ? 'border-gray-700/50 opacity-60' : 'border-gray-700'
                }`}
              >
                {/* Shelf Header */}
                <button
                  onClick={() => !isEmpty && toggleShelf(shelf.id)}
                  className={`w-full flex items-center gap-4 p-5 text-left transition-all ${
                    isEmpty ? 'cursor-default' : 'hover:bg-gray-700/20 cursor-pointer'
                  }`}
                >
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold text-lg">{shelf.zone}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-bold text-lg">{shelf.zone}-{shelf.row}</h3>
                      {isEmpty ? (
                        <span className="px-2.5 py-0.5 bg-gray-700 text-gray-400 rounded-full text-xs">Boş</span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
                          {shelf.products.length} ürün
                        </span>
                      )}
                    </div>
                    {!isEmpty && !isExpanded && (
                      <p className="text-gray-500 text-sm mt-1 truncate">
                        {shelf.products.map((p) => `${p.brand || ''} ${p.model}`.trim()).join(', ')}
                      </p>
                    )}
                  </div>
                  {!isEmpty && (
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Products List */}
                {isExpanded && shelf.products.length > 0 && (
                  <div className="border-t border-gray-700 divide-y divide-gray-700/50">
                    {shelf.products.map((product) => {
                      const status = productStatusConfig[product.status] || productStatusConfig.RECEIVED;
                      return (
                        <div key={product.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-700/10 transition-all">
                          <div className={`w-10 h-10 ${status.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            {product.status === 'IN_REPAIR' ? (
                              <Wrench className={`w-5 h-5 ${status.color}`} />
                            ) : product.status === 'WAITING_PARTS' ? (
                              <AlertTriangle className={`w-5 h-5 ${status.color}`} />
                            ) : product.status === 'COMPLETED' ? (
                              <CheckCircle2 className={`w-5 h-5 ${status.color}`} />
                            ) : (
                              <Box className={`w-5 h-5 ${status.color}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white font-medium truncate">
                                {product.brand ? `${product.brand} ` : ''}{product.model}
                              </p>
                              {product.productType && (
                                <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                                  {product.productType.type}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {product.ticket?.customer && (
                                <p className="text-gray-400 text-sm truncate max-w-[200px]" title={`${product.ticket.customer.name} ${product.ticket.customer.surname}`}>
                                  {product.ticket.customer.name} {product.ticket.customer.surname}
                                </p>
                              )}
                              {product.ticket && (
                                <span className="text-gray-600 text-xs">Servis #{product.ticket.id}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 flex items-center gap-2">
                            {movingProductId === product.id ? (
                              <div className="flex items-center gap-1">
                                <select
                                  className="bg-gray-800 border border-cyan-500 rounded-lg text-white text-xs px-2 py-1 focus:outline-none"
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      moveProductMutation.mutate({ productId: product.id, shelfId: Number(e.target.value) });
                                    }
                                  }}
                                >
                                  <option value="" disabled>Raf seç...</option>
                                  {allShelves
                                    .filter((s) => s.id !== shelf.id)
                                    .map((s) => (
                                      <option key={s.id} value={s.id}>{s.zone}-{s.row}</option>
                                    ))}
                                </select>
                                <button
                                  onClick={() => setMovingProductId(null)}
                                  className="text-gray-500 hover:text-gray-300 text-xs px-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setMovingProductId(product.id)}
                                className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-all"
                                title="Raf Değiştir"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}
                            <div>
                              <span className={`${status.bgColor} ${status.color} text-xs px-3 py-1 rounded-full font-medium`}>
                                {status.label}
                              </span>
                              {product.price && (
                                <p className="text-blue-500 text-sm font-medium mt-1">₺{Number(product.price)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
