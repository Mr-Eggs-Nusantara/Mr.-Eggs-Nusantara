import { useApi } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  Package, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ShoppingBag,
  Egg,
  Factory,
  Receipt,
  ArrowUp,
  ArrowDown,
  Zap,
  Target
} from "lucide-react";

interface DashboardStats {
  total_products: number;
  total_suppliers: number;
  today_sales_count: number;
  today_sales_amount: number;
  low_stock_products: number;
  low_stock_materials: number;
}

export default function Home() {
  const { data: stats, loading, error } = useApi<DashboardStats>("/dashboard", {
    total_products: 0,
    total_suppliers: 0,
    today_sales_count: 0,
    today_sales_amount: 0,
    low_stock_products: 0,
    low_stock_materials: 0,
  });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
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
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  const quickStats = [
    {
      title: "Total Produk",
      value: stats.total_products,
      icon: Egg,
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Supplier Aktif",
      value: stats.total_suppliers,
      icon: Building2,
      color: "from-green-400 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      trend: "+5%",
      trendUp: true
    },
    {
      title: "Penjualan Hari Ini",
      value: stats.today_sales_count,
      icon: Receipt,
      color: "from-purple-400 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-800",
      trend: "+8%",
      trendUp: true
    },
    {
      title: "Omzet Hari Ini",
      value: formatRupiah(stats.today_sales_amount),
      icon: DollarSign,
      color: "from-orange-400 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-800",
      trend: "+15%",
      trendUp: true
    }
  ];

  const alerts = [];
  if (stats.low_stock_products > 0) {
    alerts.push({
      title: "Stok Produk Menipis",
      message: `${stats.low_stock_products} produk memiliki stok di bawah minimum`,
      type: "warning",
      action: "Lihat Produk"
    });
  }
  if (stats.low_stock_materials > 0) {
    alerts.push({
      title: "Stok Bahan Baku Menipis", 
      message: `${stats.low_stock_materials} bahan baku memiliki stok di bawah minimum`,
      type: "danger",
      action: "Lihat Bahan Baku"
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard Mr. Eggs Nusantara</h1>
        <p className="text-gray-600">Sistem Manajemen Bisnis Telur Terpercaya di Nusantara</p>
        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-green-600 bg-green-50 rounded-full px-4 py-2 inline-flex">
          <Zap className="w-4 h-4" />
          <span>Sistem berjalan normal</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-200 group cursor-pointer`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor} group-hover:scale-105 transition-transform`}>
                    {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.trendUp ? (
                      <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend} vs kemarin
                    </span>
                  </div>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Peringatan</span>
          </h2>
          {alerts.map((alert, index) => (
            <div key={index} className={`border-l-4 p-4 rounded-lg ${
              alert.type === 'warning' 
                ? 'bg-yellow-50 border-yellow-400 text-yellow-800' 
                : 'bg-red-50 border-red-400 text-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{alert.title}</h3>
                  <p className="text-sm opacity-75">{alert.message}</p>
                </div>
                <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  {alert.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-orange-500" />
          <span>Aksi Cepat</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 text-left group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Buka Kasir</h3>
                <p className="text-sm text-gray-600">Mulai transaksi penjualan</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 text-left group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Produksi Batch</h3>
                <p className="text-sm text-gray-600">Buat batch produksi baru</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-200 text-left group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Pembelian</h3>
                <p className="text-sm text-gray-600">Beli bahan baku</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span>Ringkasan Penjualan</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Transaksi Hari Ini</span>
              <span className="font-bold text-green-700">{stats.today_sales_count}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Omzet</span>
              <span className="font-bold text-blue-700">{formatRupiah(stats.today_sales_amount)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Rata-rata per Transaksi</span>
              <span className="font-bold text-orange-700">
                {stats.today_sales_count > 0 ? formatRupiah(stats.today_sales_amount / stats.today_sales_count) : formatRupiah(0)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span>Status Inventori</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Produk</span>
              <span className="font-bold text-blue-700">{stats.total_products}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Stok Produk Menipis</span>
              <span className="font-bold text-yellow-700">{stats.low_stock_products}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Bahan Baku Menipis</span>
              <span className="font-bold text-red-700">{stats.low_stock_materials}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
