import { useState } from "react";
import { useApi, apiPost } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import BankAccountManager from "@/react-app/components/BankAccountManager";
import CreditPaymentManager from "@/react-app/components/CreditPaymentManager";
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  Receipt,
  ShoppingCart,
  Wallet,
  PieChart,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  CreditCard,
  FileText,
  Users
} from "lucide-react";

interface FinancialReport {
  total_income: number;
  total_expense: number;
  net_profit: number;
  recent_transactions: FinancialTransaction[];
}

interface FinancialTransaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  reference_id?: number;
  reference_type?: string;
  created_at: string;
}

interface NewTransaction {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
}

export default function Financial() {
  const { data: report, loading, error, refetch } = useApi<FinancialReport>("/financial-reports", {
    total_income: 0,
    total_expense: 0,
    net_profit: 0,
    recent_transactions: []
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'banks' | 'credit'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  const [formData, setFormData] = useState<NewTransaction>({
    type: 'expense',
    category: '',
    description: '',
    amount: 0,
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined categories
  const incomeCategories = [
    'sales', 'service', 'investment', 'loan', 'other_income'
  ];
  
  const expenseCategories = [
    'purchase', 'operational', 'salary', 'utilities', 'transport', 
    'marketing', 'maintenance', 'rent', 'insurance', 'tax', 'other_expense'
  ];

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      // Income
      'sales': 'Penjualan',
      'service': 'Jasa',
      'investment': 'Investasi',
      'loan': 'Pinjaman',
      'other_income': 'Pendapatan Lain',
      
      // Expense  
      'purchase': 'Pembelian',
      'operational': 'Operasional',
      'salary': 'Gaji',
      'utilities': 'Utilitas',
      'transport': 'Transport',
      'marketing': 'Marketing',
      'maintenance': 'Pemeliharaan',
      'rent': 'Sewa',
      'insurance': 'Asuransi',
      'tax': 'Pajak',
      'other_expense': 'Pengeluaran Lain'
    };
    
    return labels[category] || category;
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: '',
      description: '',
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description || formData.amount <= 0) {
      alert("Harap isi semua field dengan benar");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiPost("/financial-transactions", formData);
      await refetch();
      resetForm();
      alert("Transaksi keuangan berhasil dicatat!");
    } catch (error) {
      console.error("Error saving financial transaction:", error);
      alert("Terjadi kesalahan saat mencatat transaksi");
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

  // Filter transactions
  const filteredTransactions = report.recent_transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCategoryLabel(transaction.category).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = !filterCategory || transaction.category === filterCategory;
    
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.transaction_date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDateRange = transactionDate >= startDate && transactionDate <= endDate;
    }
    
    return matchesSearch && matchesType && matchesCategory && matchesDateRange;
  });

  // Get unique categories from transactions
  const uniqueCategories = [...new Set(report.recent_transactions.map(t => t.category))];

  const getTransactionIcon = (type: string, category: string) => {
    if (type === 'income') {
      return ArrowUpCircle;
    } else {
      switch (category) {
        case 'purchase': return ShoppingCart;
        case 'salary': return Building2;
        case 'operational': return Wallet;
        default: return ArrowDownCircle;
      }
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'income' 
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200';
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
          Error loading financial data: {error}
        </div>
      </div>
    );
  }

  const profitMargin = report.total_income > 0 ? (report.net_profit / report.total_income) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Keuangan</h1>
            <p className="text-gray-600">Laporan keuangan, rekening bank, dan analisis finansial</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {activeTab === 'transactions' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Catat Transaksi</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mt-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Ringkasan</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'transactions'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Transaksi</span>
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'credit'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pembayaran Kredit</span>
          </button>
          <button
            onClick={() => setActiveTab('banks')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'banks'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Rekening Bank</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'banks' && (
        <BankAccountManager />
      )}

      {activeTab === 'credit' && (
        <CreditPaymentManager />
      )}

      {activeTab === 'overview' && (
        <div>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Income */}
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Total Pemasukan</p>
                  <p className="text-2xl font-bold text-green-800">{formatRupiah(report.total_income)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-red-800">{formatRupiah(report.total_expense)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className={`rounded-2xl p-6 border ${
              report.net_profit >= 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    report.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    Laba/Rugi Bersih
                  </p>
                  <p className={`text-2xl font-bold ${
                    report.net_profit >= 0 ? 'text-blue-800' : 'text-orange-800'
                  }`}>
                    {formatRupiah(report.net_profit)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  report.net_profit >= 0 
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                    : 'bg-gradient-to-br from-orange-400 to-orange-600'
                }`}>
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Margin Keuntungan</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="all">Semua Jenis</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">Semua Kategori</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>

              {/* Date Range */}
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <Receipt className="w-6 h-6 text-orange-500" />
                <span>Riwayat Transaksi ({filteredTransactions.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Transaksi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Referensi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">Belum ada transaksi</p>
                        <p className="text-sm">
                          {searchTerm || filterType !== 'all' || filterCategory 
                            ? "Tidak ada transaksi yang sesuai dengan filter"
                            : "Mulai catat transaksi keuangan Anda"
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const TransactionIcon = getTransactionIcon(transaction.type, transaction.category);
                      const colorClass = getTransactionColor(transaction.type);
                      
                      return (
                        <tr key={transaction.id} className="hover:bg-orange-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                                <TransactionIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{transaction.description}</div>
                                <div className="text-sm text-gray-600">
                                  ID: #{transaction.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {getCategoryLabel(transaction.category)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`text-lg font-semibold ${
                              transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatRupiah(transaction.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(transaction.transaction_date)}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(transaction.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {transaction.reference_type && transaction.reference_id ? (
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">{transaction.reference_type}</div>
                                <div className="text-xs">#{transaction.reference_id}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Manual</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div>
          {/* Filters */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="all">Semua Jenis</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">Semua Kategori</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>

              {/* Date Range */}
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <Receipt className="w-6 h-6 text-orange-500" />
                <span>Riwayat Transaksi ({filteredTransactions.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Transaksi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Referensi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">Belum ada transaksi</p>
                        <p className="text-sm">
                          {searchTerm || filterType !== 'all' || filterCategory 
                            ? "Tidak ada transaksi yang sesuai dengan filter"
                            : "Mulai catat transaksi keuangan Anda"
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const TransactionIcon = getTransactionIcon(transaction.type, transaction.category);
                      const colorClass = getTransactionColor(transaction.type);
                      
                      return (
                        <tr key={transaction.id} className="hover:bg-orange-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                                <TransactionIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{transaction.description}</div>
                                <div className="text-sm text-gray-600">
                                  ID: #{transaction.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {getCategoryLabel(transaction.category)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`text-lg font-semibold ${
                              transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatRupiah(transaction.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(transaction.transaction_date)}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(transaction.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {transaction.reference_type && transaction.reference_id ? (
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">{transaction.reference_type}</div>
                                <div className="text-xs">#{transaction.reference_id}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Manual</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal - Only show on transactions tab */}
      {showForm && activeTab === 'transactions' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Catat Transaksi Keuangan</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Transaksi *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.type === 'income' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <ArrowUpCircle className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Pemasukan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.type === 'expense' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <ArrowDownCircle className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Pengeluaran</span>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Pilih kategori</option>
                  {(formData.type === 'income' ? incomeCategories : expenseCategories).map(category => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Deskripsi transaksi"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0"
                />
              </div>

              {/* Transaction Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Transaksi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Transaksi</span>
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
