import { useState } from "react";
import { useApi, apiPost } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  Plus, 
  Search, 
  Hash, 
  Calendar, 
  Building2,
  DollarSign,
  Package,
  Trash2,
  ShoppingCart,
  TrendingUp,
  Receipt
} from "lucide-react";
import { Supplier, RawMaterial } from "@/shared/types";

interface Purchase {
  id: number;
  supplier_id: number;
  supplier_name: string;
  total_amount: number;
  purchase_date: string;
  notes?: string;
  created_at: string;
}

interface PurchaseItem {
  raw_material_id: number;
  quantity: number;
  unit_price: number;
}

export default function Purchases() {
  const { data: purchases, loading, error, refetch } = useApi<Purchase[]>("/purchases", []);
  const { data: suppliers } = useApi<Supplier[]>("/suppliers", []);
  const { data: rawMaterials } = useApi<RawMaterial[]>("/raw-materials", []);
  
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierId, setSupplierId] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = () => {
    setItems([...items, { raw_material_id: 0, quantity: 0, unit_price: 0 }]);
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const resetForm = () => {
    setSupplierId(0);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setItems([]);
    setNotes("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (supplierId === 0) {
      alert("Pilih supplier terlebih dahulu");
      return;
    }
    
    if (items.length === 0) {
      alert("Minimal harus ada 1 item pembelian");
      return;
    }

    // Validate items
    const validItems = items.filter(item => item.raw_material_id > 0 && item.quantity > 0 && item.unit_price > 0);
    if (validItems.length === 0) {
      alert("Item pembelian tidak valid");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const purchaseData = {
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        items: validItems,
        notes: notes
      };
      
      await apiPost("/purchases", purchaseData);
      await refetch();
      resetForm();
      alert("Pembelian berhasil dicatat!");
    } catch (error) {
      console.error("Error creating purchase:", error);
      alert("Terjadi kesalahan saat mencatat pembelian");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
          Error loading purchases: {error}
        </div>
      </div>
    );
  }

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const todayPurchases = purchases.filter(p => p.purchase_date === new Date().toISOString().split('T')[0]);
  const todayAmount = todayPurchases.reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Pembelian</h1>
            <p className="text-gray-600">Kelola pembelian bahan baku dari supplier</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Pembelian Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Pembelian</p>
              <p className="text-2xl font-bold text-blue-800">{totalPurchases}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Total Nilai</p>
              <p className="text-xl font-bold text-green-800">{formatRupiah(totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Hari Ini</p>
              <p className="text-2xl font-bold text-purple-800">{todayPurchases.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Nilai Hari Ini</p>
              <p className="text-xl font-bold text-orange-800">{formatRupiah(todayAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari pembelian berdasarkan supplier atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  No. Pembelian
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Belum ada data pembelian</p>
                    <p className="text-sm">Buat pembelian pertama Anda untuk memulai</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                          <Hash className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">PO-{purchase.id}</div>
                          <div className="text-sm text-gray-600">
                            {formatDate(purchase.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-800">{purchase.supplier_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(purchase.purchase_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-800">
                        {formatRupiah(purchase.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {purchase.notes || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Pembelian Bahan Baku Baru</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value={0}>Pilih supplier</option>
                    {suppliers.filter(s => s.is_active).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Pembelian *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    <span>Item Pembelian</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Item</span>
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-blue-50 rounded-lg border border-blue-200">
                    <Package className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                    <p>Belum ada item pembelian</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const material = rawMaterials.find(m => m.id === item.raw_material_id);
                      const totalPrice = item.quantity * item.unit_price;
                      
                      return (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-1">
                            <select
                              value={item.raw_material_id}
                              onChange={(e) => updateItem(index, 'raw_material_id', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value={0}>Pilih bahan baku</option>
                              {rawMaterials.map(material => (
                                <option key={material.id} value={material.id}>
                                  {material.name} ({material.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="w-24">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Qty"
                              required
                            />
                            {material && (
                              <div className="text-xs text-gray-500 mt-1">{material.unit}</div>
                            )}
                          </div>
                          
                          <div className="w-32">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Harga"
                              required
                            />
                            <div className="text-xs text-gray-500 mt-1">per {material?.unit || 'unit'}</div>
                          </div>
                          
                          <div className="w-32">
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-800">
                              {formatRupiah(totalPrice)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Total</div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Total */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-green-800">Total Pembelian:</span>
                        <span className="text-2xl font-bold text-green-800">
                          {formatRupiah(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Catatan tambahan untuk pembelian ini..."
                />
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
                  disabled={isSubmitting || calculateTotal() <= 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Buat Pembelian - {formatRupiah(calculateTotal())}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
