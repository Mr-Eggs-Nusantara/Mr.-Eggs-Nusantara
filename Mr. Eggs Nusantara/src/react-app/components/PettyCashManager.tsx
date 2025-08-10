import { useState, useEffect } from "react";
import { useApi, apiPost } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  Wallet,
  Plus,
  DollarSign,
  Calendar,
  Hash,
  Receipt,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface PettyCashTransaction {
  id: number;
  transaction_type: 'in' | 'out';
  amount: number;
  description: string;
  reference_number?: string;
  transaction_date: string;
  balance_after: number;
  created_by: string;
  created_at: string;
}

interface NewPettyCashTransaction {
  transaction_type: 'in' | 'out';
  amount: number;
  description: string;
  reference_number: string;
  transaction_date: string;
}

export default function PettyCashManager() {
  const { data: transactions, loading, error, refetch } = useApi<PettyCashTransaction[]>("/petty-cash", []);
  const [balance, setBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  
  const [formData, setFormData] = useState<NewPettyCashTransaction>({
    transaction_type: 'in',
    amount: 0,
    description: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  // Load current balance
  const loadBalance = async () => {
    setBalanceLoading(true);
    try {
      const response = await fetch('/api/petty-cash/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error loading petty cash balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetForm = () => {
    setFormData({
      transaction_type: 'in',
      amount: 0,
      description: '',
      reference_number: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || formData.amount <= 0) {
      alert("Harap isi semua field dengan benar");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiPost("/petty-cash", formData);
      await Promise.all([refetch(), loadBalance()]);
      resetForm();
      alert("Transaksi kas kecil berhasil dicatat!");
    } catch (error) {
      console.error("Error saving petty cash transaction:", error);
      alert("Terjadi kesalahan saat mencatat transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.transaction_date === today);
  const todayIn = todayTransactions
    .filter(t => t.transaction_type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayOut = todayTransactions
    .filter(t => t.transaction_type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

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
          Error loading petty cash: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Balance */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Kas Kecil</h3>
                <p className="text-green-100 text-sm">Pengelolaan uang tunai harian</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="group p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                title={showBalance ? "Sembunyikan saldo" : "Tampilkan saldo"}
              >
                {showBalance ? (
                  <EyeOff className="w-5 h-5 group-hover:text-yellow-200 transition-colors duration-200" />
                ) : (
                  <Eye className="w-5 h-5 group-hover:text-yellow-200 transition-colors duration-200" />
                )}
              </button>
              <button
                onClick={() => {
                  loadBalance();
                  refetch();
                }}
                disabled={balanceLoading}
                className="group p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 group-hover:text-yellow-200 transition-colors duration-200 ${balanceLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-4xl font-bold tracking-tight transition-all duration-300">
              {showBalance ? (
                <span className="animate-fade-in">{formatRupiah(balance)}</span>
              ) : (
                <span className="tracking-widest">Rp ••••••••</span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-400/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <p className="text-xs text-green-200">Masuk Hari Ini</p>
                    <p className="text-lg font-semibold">{showBalance ? formatRupiah(todayIn) : 'Rp ••••••'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-400/20 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-300" />
                  </div>
                  <div>
                    <p className="text-xs text-red-200">Keluar Hari Ini</p>
                    <p className="text-lg font-semibold">{showBalance ? formatRupiah(todayOut) : 'Rp ••••••'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowForm(true)}
          className="group bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
        >
          <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-3 h-3" />
          </div>
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Receipt className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h3>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {transactions.length} transaksi
            </span>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Transaksi</h3>
              <p className="text-gray-600">Mulai catat transaksi kas kecil pertama Anda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                        transaction.transaction_type === 'in' 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                          : 'bg-gradient-to-br from-red-500 to-pink-600 text-white'
                      }`}>
                        {transaction.transaction_type === 'in' ? (
                          <TrendingUp className="w-6 h-6" />
                        ) : (
                          <TrendingDown className="w-6 h-6" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-bold text-gray-800">{transaction.description}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.transaction_type === 'in' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.transaction_type === 'in' ? 'Masuk' : 'Keluar'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(transaction.created_at)}</span>
                          </div>
                          
                          {transaction.reference_number && (
                            <div className="flex items-center space-x-1">
                              <Hash className="w-4 h-4" />
                              <span>{transaction.reference_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        transaction.transaction_type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'in' ? '+' : '-'}{formatRupiah(transaction.amount)}
                      </div>
                      
                      <div className="text-sm text-gray-500 mt-1">
                        Saldo: {showBalance ? (
                          <span className="font-medium">{formatRupiah(transaction.balance_after)}</span>
                        ) : (
                          <span className="tracking-wider">Rp ••••••</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Catat Transaksi Kas</h2>
                <p className="text-sm text-gray-600">Tambah transaksi masuk atau keluar</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: 'in' })}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      formData.transaction_type === 'in' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Kas Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: 'out' })}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      formData.transaction_type === 'out' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <TrendingDown className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Kas Keluar</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                  placeholder="Masukkan jumlah"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deskripsi transaksi"
                />
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Referensi</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nomor referensi (opsional)"
                />
              </div>

              {/* Transaction Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Transaksi *</label>
                <input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Simpan Transaksi</span>
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
