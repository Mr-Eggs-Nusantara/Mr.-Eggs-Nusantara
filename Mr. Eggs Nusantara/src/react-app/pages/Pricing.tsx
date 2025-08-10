import { useState } from "react";
import { useApi, apiPost } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  Edit, 
  Search, 
  Users, 
  Store, 
  Building2,
  Package,
  Tag,
  Save,
  X
} from "lucide-react";
import { Product } from "@/shared/types";



interface ProductWithPricing extends Product {
  price_umum?: number;
  price_toko?: number;
  price_grosir?: number;
  min_qty_umum?: number;
  min_qty_toko?: number;
  min_qty_grosir?: number;
}

export default function Pricing() {
  const { data: products, loading, error, refetch } = useApi<ProductWithPricing[]>("/products-with-pricing", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductWithPricing | null>(null);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [pricingData, setPricingData] = useState({
    price_umum: 0,
    price_toko: 0,
    price_grosir: 0,
    min_qty_umum: 1,
    min_qty_toko: 1,
    min_qty_grosir: 1
  });

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'umum':
        return { label: 'Umum', icon: Users, color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' };
      case 'toko':
        return { label: 'Toko', icon: Store, color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' };
      case 'grosir':
        return { label: 'Grosir', icon: Building2, color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' };
      default:
        return { label: tier, icon: Tag, color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
    }
  };

  const handleEditPricing = (product: ProductWithPricing) => {
    setEditingProduct(product);
    setPricingData({
      price_umum: product.price_umum || product.selling_price || 0,
      price_toko: product.price_toko || product.selling_price || 0,
      price_grosir: product.price_grosir || product.selling_price || 0,
      min_qty_umum: product.min_qty_umum || 1,
      min_qty_toko: product.min_qty_toko || 1,
      min_qty_grosir: product.min_qty_grosir || 1
    });
    setShowPricingForm(true);
  };

  const handleSavePricing = async () => {
    if (!editingProduct) return;

    try {
      await apiPost(`/products/${editingProduct.id}/pricing`, pricingData);
      await refetch();
      setShowPricingForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving pricing:", error);
      alert("Terjadi kesalahan saat menyimpan harga");
    }
  };

  const resetForm = () => {
    setShowPricingForm(false);
    setEditingProduct(null);
    setPricingData({
      price_umum: 0,
      price_toko: 0,
      price_grosir: 0,
      min_qty_umum: 1,
      min_qty_toko: 1,
      min_qty_grosir: 1
    });
  };

  const calculateMargin = (sellingPrice: number, costPrice: number) => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 15) return 'text-orange-600';
    return 'text-red-600';
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
          Error loading pricing data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Harga</h1>
            <p className="text-gray-600">Kelola harga produk untuk berbagai kategori pelanggan</p>
          </div>
        </div>
      </div>

      {/* Price Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {(['umum', 'toko', 'grosir'] as const).map((tier) => {
          const tierInfo = getTierInfo(tier);
          const TierIcon = tierInfo.icon;
          const tierProducts = products.filter(p => p[`price_${tier}` as keyof ProductWithPricing]);
          
          return (
            <div key={tier} className={`${tierInfo.bgColor} rounded-2xl p-6 border border-${tier === 'umum' ? 'blue' : tier === 'toko' ? 'green' : 'purple'}-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${tierInfo.color} rounded-xl flex items-center justify-center`}>
                    <TierIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${tierInfo.textColor}`}>
                      Harga {tierInfo.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tierProducts.length} produk dikonfigurasi
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Target:</strong></p>
                <p className="mt-1">
                  {tier === 'umum' && "Pelanggan perorangan, pembelian satuan"}
                  {tier === 'toko' && "Toko kecil, pembelian dalam jumlah sedang"}
                  {tier === 'grosir' && "Distributor, pembelian dalam jumlah besar"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Products Pricing Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Harga Umum
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Harga Toko
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Harga Grosir
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Belum ada data produk</p>
                    <p className="text-sm">Tambahkan produk terlebih dahulu</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{product.name}</div>
                          <div className="text-sm text-gray-600">
                            HPP: {formatRupiah(product.cost_price || 0)} per {product.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Umum Price */}
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-800">
                          {formatRupiah(product.price_umum || product.selling_price || 0)}
                        </div>
                        <div className={`text-sm font-medium ${getMarginColor(calculateMargin(product.price_umum || product.selling_price || 0, product.cost_price || 0))}`}>
                          {calculateMargin(product.price_umum || product.selling_price || 0, product.cost_price || 0).toFixed(1)}% margin
                        </div>
                        {product.min_qty_umum && product.min_qty_umum > 1 && (
                          <div className="text-xs text-gray-500">
                            Min: {product.min_qty_umum} {product.unit}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Toko Price */}
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-800">
                          {product.price_toko ? formatRupiah(product.price_toko) : (
                            <span className="text-gray-400 italic">Belum diatur</span>
                          )}
                        </div>
                        {product.price_toko && (
                          <div className={`text-sm font-medium ${getMarginColor(calculateMargin(product.price_toko, product.cost_price || 0))}`}>
                            {calculateMargin(product.price_toko, product.cost_price || 0).toFixed(1)}% margin
                          </div>
                        )}
                        {product.min_qty_toko && product.min_qty_toko > 1 && (
                          <div className="text-xs text-gray-500">
                            Min: {product.min_qty_toko} {product.unit}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Grosir Price */}
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-800">
                          {product.price_grosir ? formatRupiah(product.price_grosir) : (
                            <span className="text-gray-400 italic">Belum diatur</span>
                          )}
                        </div>
                        {product.price_grosir && (
                          <div className={`text-sm font-medium ${getMarginColor(calculateMargin(product.price_grosir, product.cost_price || 0))}`}>
                            {calculateMargin(product.price_grosir, product.cost_price || 0).toFixed(1)}% margin
                          </div>
                        )}
                        {product.min_qty_grosir && product.min_qty_grosir > 1 && (
                          <div className="text-xs text-gray-500">
                            Min: {product.min_qty_grosir} {product.unit}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEditPricing(product)}
                        className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                        title="Atur Harga"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Form Modal */}
      {showPricingForm && editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Atur Harga: {editingProduct.name}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">HPP:</span>
                  <span className="ml-2 font-semibold">{formatRupiah(editingProduct.cost_price || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Satuan:</span>
                  <span className="ml-2 font-semibold">{editingProduct.unit}</span>
                </div>
                <div>
                  <span className="text-gray-600">Stok:</span>
                  <span className="ml-2 font-semibold">{editingProduct.stock_quantity} {editingProduct.unit}</span>
                </div>
              </div>
            </div>

            {/* Pricing Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['umum', 'toko', 'grosir'] as const).map((tier) => {
                const tierInfo = getTierInfo(tier);
                const TierIcon = tierInfo.icon;
                
                return (
                  <div key={tier} className={`${tierInfo.bgColor} rounded-xl p-4 border border-${tier === 'umum' ? 'blue' : tier === 'toko' ? 'green' : 'purple'}-200`}>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className={`w-8 h-8 ${tierInfo.color} rounded-lg flex items-center justify-center`}>
                        <TierIcon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className={`font-semibold ${tierInfo.textColor}`}>
                        Harga {tierInfo.label}
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Harga per {editingProduct.unit}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pricingData[`price_${tier}` as keyof typeof pricingData] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPricingData({ 
                              ...pricingData, 
                              [`price_${tier}`]: value === '' ? 0 : parseFloat(value) || 0
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Masukkan harga..."
                        />
                        
                        {/* Margin Calculation */}
                        {pricingData[`price_${tier}` as keyof typeof pricingData] > 0 && (
                          <div className={`mt-1 text-sm ${getMarginColor(calculateMargin(pricingData[`price_${tier}` as keyof typeof pricingData], editingProduct.cost_price || 0))}`}>
                            Margin: {calculateMargin(pricingData[`price_${tier}` as keyof typeof pricingData], editingProduct.cost_price || 0).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Pembelian
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={pricingData[`min_qty_${tier}` as keyof typeof pricingData] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === '' ? 1 : parseInt(value);
                            setPricingData({ 
                              ...pricingData, 
                              [`min_qty_${tier}`]: numValue >= 1 ? numValue : 1
                            });
                          }}
                          onBlur={(e) => {
                            // Pastikan nilai minimal 1 saat kehilangan fokus
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) {
                              setPricingData({ 
                                ...pricingData, 
                                [`min_qty_${tier}`]: 1
                              });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center font-medium"
                          placeholder="Masukkan jumlah minimum..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {editingProduct.unit} minimum untuk harga {tierInfo.label.toLowerCase()}
                        </p>
                        <div className="mt-1">
                          <p className="text-xs text-blue-600">
                            💡 Contoh: 1 (retail), 12 (dus), 30+ (grosir)
                          </p>
                          {pricingData[`min_qty_${tier}` as keyof typeof pricingData] > 1 && 
                           pricingData[`price_${tier}` as keyof typeof pricingData] > 0 && (
                            <div className="mt-2 p-2 bg-white/70 rounded border border-gray-200">
                              <p className="text-xs text-gray-700 font-medium">
                                Preview: Min. {pricingData[`min_qty_${tier}` as keyof typeof pricingData]} {editingProduct.unit} = {formatRupiah((pricingData[`min_qty_${tier}` as keyof typeof pricingData] || 1) * (pricingData[`price_${tier}` as keyof typeof pricingData] || 0))}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Summary Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6 mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Ringkasan Pricing Strategy</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {(['umum', 'toko', 'grosir'] as const).map((tier) => {
                  const tierInfo = getTierInfo(tier);
                  const price = pricingData[`price_${tier}` as keyof typeof pricingData] || 0;
                  const minQty = pricingData[`min_qty_${tier}` as keyof typeof pricingData] || 1;
                  const totalMin = price * minQty;
                  
                  return (
                    <div key={tier} className={`p-3 ${tierInfo.bgColor} rounded-lg border`}>
                      <p className={`font-medium ${tierInfo.textColor}`}>{tierInfo.label}</p>
                      {price > 0 ? (
                        <>
                          <p className="text-gray-700">Harga: {formatRupiah(price)}</p>
                          <p className="text-gray-700">Min: {minQty} {editingProduct.unit}</p>
                          <p className="font-medium text-gray-800">Total min: {formatRupiah(totalMin)}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">Belum diatur</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSavePricing}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Harga</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
