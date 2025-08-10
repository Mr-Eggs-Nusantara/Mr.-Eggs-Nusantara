import { useState } from "react";
import { useApi, apiPost, apiPut, apiDelete } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Package, 
  AlertTriangle,
  Scale,
  DollarSign,
  TrendingDown,
  Egg
} from "lucide-react";
import { RawMaterial } from "@/shared/types";

export default function RawMaterials() {
  const { data: materials, loading, error, refetch } = useApi<RawMaterial[]>("/raw-materials", []);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<RawMaterial>>({
    name: "",
    unit: "",
    stock_quantity: 0,
    unit_cost: 0,
    minimum_stock: 0
  });

  const filteredMaterials = materials.filter(material =>
    material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.unit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      unit: "",
      stock_quantity: 0,
      unit_cost: 0,
      minimum_stock: 0
    });
    setEditingMaterial(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMaterial) {
        await apiPut(`/raw-materials/${editingMaterial.id}`, formData);
      } else {
        await apiPost("/raw-materials", formData);
      }
      
      await refetch();
      resetForm();
    } catch (error) {
      console.error("Error saving raw material:", error);
      alert("Terjadi kesalahan saat menyimpan data bahan baku");
    }
  };

  const handleEdit = (material: RawMaterial) => {
    setFormData(material);
    setEditingMaterial(material);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus bahan baku "${name}"?`)) {
      try {
        await apiDelete(`/raw-materials/${id}`);
        await refetch();
      } catch (error) {
        console.error("Error deleting raw material:", error);
        alert("Terjadi kesalahan saat menghapus bahan baku");
      }
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const isLowStock = (current: number, minimum: number) => {
    return current <= minimum;
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { label: "Habis", color: "bg-red-100 text-red-800", icon: AlertTriangle };
    if (current <= minimum) return { label: "Menipis", color: "bg-yellow-100 text-yellow-800", icon: TrendingDown };
    return { label: "Aman", color: "bg-green-100 text-green-800", icon: Package };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading raw materials: {error}
        </div>
      </div>
    );
  }

  const lowStockMaterials = materials.filter(m => isLowStock(m.stock_quantity || 0, m.minimum_stock || 0));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Bahan Baku</h1>
            <p className="text-gray-600">Kelola stok dan harga bahan baku telur</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Bahan Baku</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockMaterials.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Peringatan Stok Menipis
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {lowStockMaterials.length} bahan baku memiliki stok di bawah minimum. 
                Segera lakukan pembelian untuk menghindari kehabisan stok.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari bahan baku berdasarkan nama atau satuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bahan Baku
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Harga Satuan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Nilai
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Egg className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Belum ada data bahan baku</p>
                    <p className="text-sm">Tambahkan bahan baku pertama Anda untuk memulai</p>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => {
                  const stockStatus = getStockStatus(material.stock_quantity || 0, material.minimum_stock || 0);
                  const StatusIcon = stockStatus.icon;
                  const totalValue = (material.stock_quantity || 0) * (material.unit_cost || 0);
                  
                  return (
                    <tr key={material.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <Egg className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{material.name}</div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Scale className="w-3 h-3" />
                              <span>per {material.unit}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-gray-800">
                            {(material.stock_quantity || 0).toLocaleString()} {material.unit}
                          </div>
                          <div className="text-sm text-gray-600">
                            Min: {(material.minimum_stock || 0).toLocaleString()} {material.unit}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-gray-800 font-medium">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatRupiah(material.unit_cost || 0)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-semibold text-gray-800">
                          {formatRupiah(totalValue)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(material)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(material.id!, material.name!)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingMaterial ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Bahan Baku *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Contoh: Telur Ayam Segar"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satuan *
                </label>
                <select
                  required
                  value={formData.unit || ""}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Pilih satuan</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="gram">Gram (g)</option>
                  <option value="butir">Butir</option>
                  <option value="lusin">Lusin</option>
                  <option value="krat">Krat</option>
                  <option value="dus">Dus</option>
                  <option value="kardus">Kardus</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="tray">Tray</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stock_quantity || 0}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimum_stock || 0}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Per Satuan
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_cost || 0}
                  onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Harga dalam Rupiah per satuan
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-colors"
                >
                  {editingMaterial ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
