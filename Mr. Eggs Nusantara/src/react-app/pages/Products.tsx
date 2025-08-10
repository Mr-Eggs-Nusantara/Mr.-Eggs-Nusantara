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
  Egg,
  ShoppingBag,
  Star,
  BookOpen
} from "lucide-react";
import { Product, RawMaterial, ProductRecipeItem } from "@/shared/types";

export default function Products() {
  const { data: products, loading, error, refetch } = useApi<Product[]>("/products", []);
  const { data: rawMaterials } = useApi<RawMaterial[]>("/raw-materials", []);
  const [showForm, setShowForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recipeItems, setRecipeItems] = useState<ProductRecipeItem[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    unit: "",
    selling_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    minimum_stock: 0,
    is_active: true
  });

  // Load recipe when editing product recipe
  const loadRecipe = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}/recipe`);
      const recipe = await response.json();
      
      const items = recipe.map((item: any) => ({
        raw_material_id: item.raw_material_id,
        quantity_needed: item.quantity_needed
      }));
      
      setRecipeItems(items);
    } catch (error) {
      console.error("Error loading recipe:", error);
      setRecipeItems([]);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.unit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      unit: "",
      selling_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      minimum_stock: 0,
      is_active: true
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await apiPut(`/products/${editingProduct.id}`, formData);
      } else {
        await apiPost("/products", formData);
      }
      
      await refetch();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Terjadi kesalahan saat menyimpan data produk");
    }
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) {
      try {
        await apiDelete(`/products/${id}`);
        await refetch();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Terjadi kesalahan saat menghapus produk");
      }
    }
  };

  const handleRecipe = (product: Product) => {
    setRecipeProduct(product);
    setShowRecipeForm(true);
    loadRecipe(product.id!);
  };

  const handleRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipeProduct) return;

    try {
      const response = await fetch(`/api/products/${recipeProduct.id}/recipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: recipeItems.filter(item => item.quantity_needed > 0)
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save recipe");
      }

      await refetch();
      setShowRecipeForm(false);
      setRecipeProduct(null);
      setRecipeItems([]);
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Terjadi kesalahan saat menyimpan resep");
    }
  };

  const addRecipeItem = () => {
    setRecipeItems([...recipeItems, { raw_material_id: 0, quantity_needed: 0 }]);
  };

  const updateRecipeItem = (index: number, field: keyof ProductRecipeItem, value: number) => {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeItems(updated);
  };

  const removeRecipeItem = (index: number) => {
    const updated = recipeItems.filter((_, i) => i !== index);
    setRecipeItems(updated);
  };

  const calculateRecipeCost = () => {
    return recipeItems.reduce((total, item) => {
      const material = rawMaterials.find(m => m.id === item.raw_material_id);
      return total + ((material?.unit_cost || 0) * item.quantity_needed);
    }, 0);
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

  const getMarginPercentage = (sellingPrice: number, costPrice: number) => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
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
          Error loading products: {error}
        </div>
      </div>
    );
  }

  const lowStockProducts = products.filter(p => isLowStock(p.stock_quantity || 0, p.minimum_stock || 0) && p.is_active);
  const totalStockValue = products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0);
  const averageMargin = products.length > 0 
    ? products.reduce((sum, p) => sum + getMarginPercentage(p.selling_price || 0, p.cost_price || 0), 0) / products.length
    : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Produk</h1>
            <p className="text-gray-600">Kelola katalog produk telur kemasan</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Produk</p>
              <p className="text-2xl font-bold text-blue-800">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Nilai Stok Total</p>
              <p className="text-xl font-bold text-green-800">{formatRupiah(totalStockValue)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Rata-rata Margin</p>
              <p className="text-2xl font-bold text-purple-800">{averageMargin.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Peringatan Stok Produk Menipis
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {lowStockProducts.length} produk memiliki stok di bawah minimum. 
                Segera lakukan produksi atau pemesanan untuk menghindari kehabisan stok.
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
            placeholder="Cari produk berdasarkan nama, deskripsi, atau satuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Margin
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
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Belum ada data produk</p>
                    <p className="text-sm">Tambahkan produk pertama Anda untuk memulai</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity || 0, product.minimum_stock || 0);
                  const StatusIcon = stockStatus.icon;
                  const margin = getMarginPercentage(product.selling_price || 0, product.cost_price || 0);
                  const stockValue = (product.stock_quantity || 0) * (product.cost_price || 0);
                  
                  return (
                    <tr key={product.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                            <Egg className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-600 line-clamp-1">{product.description}</div>
                            )}
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Scale className="w-3 h-3" />
                              <span>per {product.unit}</span>
                              {!product.is_active && (
                                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  Tidak Aktif
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-gray-800">
                            {(product.stock_quantity || 0).toLocaleString()} {product.unit}
                          </div>
                          <div className="text-sm text-gray-600">
                            Min: {(product.minimum_stock || 0).toLocaleString()} {product.unit}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            Nilai: {formatRupiah(stockValue)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-gray-800">
                            {formatRupiah(product.selling_price || 0)}
                          </div>
                          <div className="text-sm text-gray-600">
                            HPP: {formatRupiah(product.cost_price || 0)}
                            {(product.cost_price || 0) > 0 && (
                              <span className="ml-1 text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">
                                Auto
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-lg font-semibold ${
                          margin > 30 ? 'text-green-600' : 
                          margin > 15 ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>
                          {margin.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          Laba: {formatRupiah((product.selling_price || 0) - (product.cost_price || 0))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {stockStatus.label}
                          </span>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.is_active 
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {product.is_active ? "Aktif" : "Tidak Aktif"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleRecipe(product)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Atur Resep"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id!, product.name!)}
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Contoh: Telur Ayam Grade A"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Deskripsi singkat produk"
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
                  <option value="pack">Pack</option>
                  <option value="box">Box</option>
                  <option value="tray">Tray</option>
                  <option value="dus">Dus</option>
                  <option value="kardus">Kardus</option>
                  <option value="lusin">Lusin</option>
                  <option value="krat">Krat</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="unit">Unit</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Jual *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.selling_price || 0}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Pokok (HPP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price || 0}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    HPP akan diupdate otomatis saat ada produksi batch
                  </p>
                </div>
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

              {/* Margin Preview */}
              {(formData.selling_price || 0) > 0 && (formData.cost_price || 0) > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <p><strong>Preview Margin:</strong></p>
                    <p>Laba per unit: {formatRupiah((formData.selling_price || 0) - (formData.cost_price || 0))}</p>
                    <p>Margin: {getMarginPercentage(formData.selling_price || 0, formData.cost_price || 0).toFixed(1)}%</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Produk aktif (tersedia untuk dijual)
                </label>
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
                  {editingProduct ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Form Modal */}
      {showRecipeForm && recipeProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Resep Produk: {recipeProduct.name}
            </h2>
            
            <form onSubmit={handleRecipeSubmit} className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Petunjuk:</strong> Tentukan bahan baku yang dibutuhkan untuk membuat 1 unit "{recipeProduct.name}".
                  Harga pokok produk akan dihitung otomatis berdasarkan resep ini.
                </p>
              </div>

              {/* Recipe Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Bahan Baku yang Dibutuhkan</h3>
                  <button
                    type="button"
                    onClick={addRecipeItem}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Bahan</span>
                  </button>
                </div>

                {recipeItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Belum ada bahan baku yang ditambahkan</p>
                    <p className="text-sm">Klik "Tambah Bahan" untuk mulai membuat resep</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recipeItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bahan Baku
                          </label>
                          <select
                            value={item.raw_material_id}
                            onChange={(e) => updateRecipeItem(index, 'raw_material_id', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value={0}>Pilih bahan baku</option>
                            {rawMaterials.map(material => (
                              <option key={material.id} value={material.id}>
                                {material.name} (per {material.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity_needed}
                            onChange={(e) => updateRecipeItem(index, 'quantity_needed', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                            required
                          />
                        </div>

                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Biaya
                          </label>
                          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 font-medium">
                            {formatRupiah(
                              (rawMaterials.find(m => m.id === item.raw_material_id)?.unit_cost || 0) * item.quantity_needed
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeRecipeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Total Cost */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Total Harga Pokok Produk (HPP)</p>
                          <p className="text-xs text-green-600">Per 1 unit {recipeProduct.name}</p>
                        </div>
                        <div className="text-2xl font-bold text-green-800">
                          {formatRupiah(calculateRecipeCost())}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecipeForm(false);
                    setRecipeProduct(null);
                    setRecipeItems([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
                >
                  Simpan Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
