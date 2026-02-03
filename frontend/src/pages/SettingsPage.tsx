import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export const SettingsPage = () => {
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [newShelf, setNewShelf] = useState({ zone: '', row: '' });

  const queryClient = useQueryClient();

  const { data: productTypes } = useQuery({
    queryKey: ['productTypes'],
    queryFn: settingsAPI.getProductTypes,
  });

  const { data: shelves } = useQuery({
    queryKey: ['shelves'],
    queryFn: settingsAPI.getShelves,
  });

  const createTypeMutation = useMutation({
    mutationFn: settingsAPI.createProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      setIsTypeModalOpen(false);
      setNewType('');
    },
  });

  const createShelfMutation = useMutation({
    mutationFn: ({ zone, row }: { zone: string; row: number }) => 
      settingsAPI.createShelf(zone, row),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      setIsShelfModalOpen(false);
      setNewShelf({ zone: '', row: '' });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">Sistem ayarları ve yapılandırma</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Types */}
        <Card
          title="Ürün Tipleri"
          actions={
            <Button size="sm" onClick={() => setIsTypeModalOpen(true)}>
              <Plus size={16} className="mr-1" />
              Ekle
            </Button>
          }
        >
          <div className="space-y-2">
            {productTypes?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz ürün tipi yok</p>
            ) : (
              productTypes?.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{type.type}</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(type.created_at), 'dd.MM.yyyy')}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Shelves */}
        <Card
          title="Raflar"
          actions={
            <Button size="sm" onClick={() => setIsShelfModalOpen(true)}>
              <Plus size={16} className="mr-1" />
              Ekle
            </Button>
          }
        >
          <div className="space-y-2">
            {shelves?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz raf yok</p>
            ) : (
              shelves?.map((shelf) => (
                <div
                  key={shelf.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <span className="font-medium text-gray-900">
                    Bölge {shelf.zone} - Sıra {shelf.row}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(shelf.created_at), 'dd.MM.yyyy')}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Add Product Type Modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => {
          setIsTypeModalOpen(false);
          setNewType('');
        }}
        title="Yeni Ürün Tipi"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTypeModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => createTypeMutation.mutate(newType)}
              isLoading={createTypeMutation.isPending}
              disabled={!newType}
            >
              Ekle
            </Button>
          </>
        }
      >
        <Input
          label="Ürün Tipi *"
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          placeholder="Telefon, Tablet, vb."
          autoFocus
        />
      </Modal>

      {/* Add Shelf Modal */}
      <Modal
        isOpen={isShelfModalOpen}
        onClose={() => {
          setIsShelfModalOpen(false);
          setNewShelf({ zone: '', row: '' });
        }}
        title="Yeni Raf"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsShelfModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() =>
                createShelfMutation.mutate({
                  zone: newShelf.zone,
                  row: Number(newShelf.row),
                })
              }
              isLoading={createShelfMutation.isPending}
              disabled={!newShelf.zone || !newShelf.row}
            >
              Ekle
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Bölge *"
            value={newShelf.zone}
            onChange={(e) => setNewShelf({ ...newShelf, zone: e.target.value })}
            placeholder="A, B, C..."
            autoFocus
          />
          <Input
            type="number"
            label="Sıra *"
            value={newShelf.row}
            onChange={(e) => setNewShelf({ ...newShelf, row: e.target.value })}
            placeholder="1, 2, 3..."
          />
        </div>
      </Modal>
    </div>
  );
};
