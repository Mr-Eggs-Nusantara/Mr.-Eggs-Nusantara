import { useState } from "react";
import { useApi, apiPost } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import useScrollLock from "@/react-app/hooks/useScrollLock";
import { 
  Plus, 
  Search, 
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Banknote,
  Building,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  Bell,
  Send
} from "lucide-react";

interface CreditSale {
  id: number;
  sale_id: number;
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  amount_paid: number;
  amount_remaining: number;
  due_date?: string;
  status: 'outstanding' | 'partial' | 'paid' | 'overdue';
  interest_rate: number;
  payment_terms?: string;
  notes?: string;
  sale_date: string;
  created_at: string;
}

interface CreditPayment {
  id: number;
  credit_sale_id: number;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

interface NewPayment {
  credit_sale_id: number;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
}

interface QuickPaymentOption {
  label: string;
  amount: number;
  percentage?: number;
}

export default function CreditPaymentManager() {
  const { data: creditSales, loading, error, refetch } = useApi<CreditSale[]>("/credit-sales", []);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showBatchPayment, setShowBatchPayment] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState<number | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<CreditSale | null>(null);
  const [selectedCredits, setSelectedCredits] = useState<number[]>([]);
  
  const [paymentFormData, setPaymentFormData] = useState<NewPayment>({
    credit_sale_id: 0,
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  const [payments, setPayments] = useState<CreditPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  // Lock scroll when modals are open
  useScrollLock(showPaymentForm || showBatchPayment);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (status: string, dueDate?: string) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date();
    
    if (isOverdue && status !== 'paid') {
      return {
        label: 'Terlambat',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertTriangle
      };
    }
    
    switch (status) {
      case 'paid':
        return {
          label: 'Lunas',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle
        };
      case 'partial':
        return {
          label: 'Cicilan',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Clock
        };
      case 'outstanding':
        return {
          label: 'Belum Bayar',
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: CreditCard
        };
      default:
        return {
          label: status,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: FileText
        };
    }
  };

  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'cash':
        return { label: 'Tunai', icon: Banknote, color: 'text-green-600' };
      case 'transfer':
        return { label: 'Transfer', icon: CreditCard, color: 'text-blue-600' };
      case 'credit':
        return { label: 'Kredit', icon: Building, color: 'text-orange-600' };
      default:
        return { label: method, icon: DollarSign, color: 'text-gray-600' };
    }
  };

  const getQuickPaymentOptions = (credit: CreditSale): QuickPaymentOption[] => {
    const remaining = credit.amount_remaining;
    
    return [
      { label: 'Lunas', amount: remaining, percentage: 100 },
      { label: '50%', amount: Math.round(remaining * 0.5), percentage: 50 },
      { label: '25%', amount: Math.round(remaining * 0.25), percentage: 25 },
      { label: 'Rp 100.000', amount: Math.min(100000, remaining) },
      { label: 'Rp 500.000', amount: Math.min(500000, remaining) },
      { label: 'Rp 1.000.000', amount: Math.min(1000000, remaining) }
    ].filter(option => option.amount > 0 && option.amount <= remaining);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      credit_sale_id: 0,
      payment_amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference_number: '',
      notes: ''
    });
    setSelectedCredit(null);
    setShowPaymentForm(false);
  };

  const handleAddPayment = (creditSale: CreditSale) => {
    setSelectedCredit(creditSale);
    setPaymentFormData({
      ...paymentFormData,
      credit_sale_id: creditSale.id,
      payment_amount: creditSale.amount_remaining
    });
    setShowPaymentForm(true);
  };

  const handleQuickPayment = async (creditSale: CreditSale, amount: number, percentage?: number) => {
    if (isSubmitting) return; // Prevent double submission
    
    const paymentData = {
      credit_sale_id: creditSale.id,
      payment_amount: amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference_number: '',
      notes: percentage ? `Pembayaran ${percentage}% dari sisa tagihan` : `Pembayaran ${formatRupiah(amount)}`
    };

    setIsSubmitting(true);
    
    try {
      await apiPost("/credit-payments", paymentData);
      await refetch();
      alert(`Pembayaran ${formatRupiah(amount)} berhasil dicatat!`);
    } catch (error: any) {
      console.error("Error saving payment:", error);
      const errorMessage = error?.message || "Terjadi kesalahan saat mencatat pembayaran";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentFormData.credit_sale_id || paymentFormData.payment_amount <= 0) {
      alert("Harap isi semua field dengan benar");
      return;
    }

    if (selectedCredit && paymentFormData.payment_amount > selectedCredit.amount_remaining) {
      alert("Jumlah pembayaran tidak boleh lebih dari sisa tagihan");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiPost("/credit-payments", paymentFormData);
      await refetch();
      
      // Refresh payment history if currently viewing
      if (showPaymentHistory === paymentFormData.credit_sale_id) {
        await loadPaymentHistory(paymentFormData.credit_sale_id);
      }
      
      resetPaymentForm();
      alert("Pembayaran berhasil dicatat!");
    } catch (error: any) {
      console.error("Error saving payment:", error);
      const errorMessage = error?.message || "Terjadi kesalahan saat mencatat pembayaran";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchPayment = async (amount: number, notes: string) => {
    if (selectedCredits.length === 0) {
      alert("Pilih minimal satu tagihan untuk pembayaran batch");
      return;
    }

    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    
    try {
      const successCount = [];
      const errorCount = [];
      
      for (const creditId of selectedCredits) {
        const credit = creditSales.find(c => c.id === creditId);
        if (credit && credit.amount_remaining >= amount) {
          try {
            await apiPost("/credit-payments", {
              credit_sale_id: creditId,
              payment_amount: amount,
              payment_date: new Date().toISOString().split('T')[0],
              payment_method: 'cash',
              reference_number: '',
              notes: `Batch payment: ${notes}`
            });
            successCount.push(creditId);
          } catch (error) {
            console.error(`Error processing payment for credit ${creditId}:`, error);
            errorCount.push(creditId);
          }
        }
      }
      
      await refetch();
      setSelectedCredits([]);
      setShowBatchPayment(false);
      
      if (errorCount.length === 0) {
        alert(`Pembayaran batch untuk ${successCount.length} tagihan berhasil!`);
      } else {
        alert(`${successCount.length} pembayaran berhasil, ${errorCount.length} gagal. Silakan cek status dan coba lagi.`);
      }
    } catch (error: any) {
      console.error("Error processing batch payment:", error);
      const errorMessage = error?.message || "Terjadi kesalahan saat memproses pembayaran batch";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPaymentHistory = async (creditSaleId: number) => {
    setLoadingPayments(true);
    try {
      const response = await fetch(`/api/credit-sales/${creditSaleId}/payments`);
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleShowPaymentHistory = async (creditSaleId: number) => {
    if (showPaymentHistory === creditSaleId) {
      setShowPaymentHistory(null);
      setPayments([]);
    } else {
      setShowPaymentHistory(creditSaleId);
      await loadPaymentHistory(creditSaleId);
    }
  };

  const sendPaymentReminder = async (credit: CreditSale) => {
    // Simulasi pengiriman reminder
    alert(`Reminder pembayaran akan dikirim ke ${credit.customer_name} (${credit.customer_phone || 'No phone'})`);
  };

  // Filter credit sales
  const filteredCreditSales = creditSales.filter(credit => {
    const matchesSearch = credit.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credit.sale_id.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || credit.status === filterStatus;
    const isOverdue = credit.due_date && new Date(credit.due_date) < new Date() && credit.status !== 'paid';
    const matchesOverdue = !filterOverdue || isOverdue;
    
    return matchesSearch && matchesStatus && matchesOverdue;
  });

  // Calculate summary stats
  const totalOutstanding = filteredCreditSales.reduce((sum, credit) => sum + credit.amount_remaining, 0);
  const totalPaid = filteredCreditSales.reduce((sum, credit) => sum + credit.amount_paid, 0);
  const overdueCount = filteredCreditSales.filter(credit => 
    credit.due_date && new Date(credit.due_date) < new Date() && credit.status !== 'paid'
  ).length;
  const dueSoonCount = filteredCreditSales.filter(credit => {
    if (!credit.due_date || credit.status === 'paid') return false;
    const dueDate = new Date(credit.due_date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

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
          Error loading credit sales: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen pb-20">
      {/* Enhanced Header with Summary Stats */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Manajemen Pembayaran Kredit</h3>
                <p className="text-blue-100 text-sm">{filteredCreditSales.length} transaksi kredit</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedCredits.length > 0 && (
                <button
                  onClick={() => setShowBatchPayment(true)}
                  className="group p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-green-400/30"
                  title="Batch Payment"
                >
                  <Zap className="w-5 h-5 text-green-300" />
                </button>
              )}
              
              <button
                onClick={() => setShowReminders(!showReminders)}
                className="group p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                title="Show reminders"
              >
                <Bell className={`w-5 h-5 transition-colors duration-200 ${showReminders ? 'text-yellow-300' : 'text-white'}`} />
              </button>
              
              <button
                onClick={refetch}
                disabled={loading}
                className="group p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 group-hover:text-yellow-200 transition-colors duration-200 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-400/20 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-300" />
                </div>
                <div>
                  <p className="text-xs text-blue-200">Total Piutang</p>
                  <p className="text-lg font-semibold">{formatRupiah(totalOutstanding)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-400/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-300" />
                </div>
                <div>
                  <p className="text-xs text-blue-200">Sudah Dibayar</p>
                  <p className="text-lg font-semibold">{formatRupiah(totalPaid)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-300" />
                </div>
                <div>
                  <p className="text-xs text-blue-200">Terlambat</p>
                  <p className="text-lg font-semibold">{overdueCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <p className="text-xs text-blue-200">Jatuh Tempo 7 Hari</p>
                  <p className="text-lg font-semibold">{dueSoonCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-400/20 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-xs text-blue-200">Total Transaksi</p>
                  <p className="text-lg font-semibold">{filteredCreditSales.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari customer atau invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="outstanding">Belum Bayar</option>
            <option value="partial">Cicilan</option>
            <option value="paid">Lunas</option>
            <option value="overdue">Terlambat</option>
          </select>

          {/* Overdue Filter */}
          <label className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
            <input
              type="checkbox"
              checked={filterOverdue}
              onChange={(e) => setFilterOverdue(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Hanya Terlambat</span>
          </label>

          {/* Batch Selection Info */}
          <div className="flex items-center space-x-2">
            {selectedCredits.length > 0 && (
              <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                {selectedCredits.length} dipilih
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reminders Panel */}
      {showReminders && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Reminder Pembayaran</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-red-700 mb-2">Terlambat ({overdueCount})</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filteredCreditSales
                  .filter(credit => credit.due_date && new Date(credit.due_date) < new Date() && credit.status !== 'paid')
                  .slice(0, 5)
                  .map(credit => (
                    <div key={credit.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                      <span className="text-gray-700">{credit.customer_name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600 font-medium">
                          {formatRupiah(credit.amount_remaining)}
                        </span>
                        <button
                          onClick={() => sendPaymentReminder(credit)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Send reminder"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-orange-700 mb-2">Jatuh Tempo 7 Hari ({dueSoonCount})</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filteredCreditSales
                  .filter(credit => {
                    if (!credit.due_date || credit.status === 'paid') return false;
                    const dueDate = new Date(credit.due_date);
                    const today = new Date();
                    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 7;
                  })
                  .slice(0, 5)
                  .map(credit => (
                    <div key={credit.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                      <span className="text-gray-700">{credit.customer_name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-600 font-medium">
                          {formatRupiah(credit.amount_remaining)}
                        </span>
                        <button
                          onClick={() => sendPaymentReminder(credit)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Send reminder"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Sales List */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <span>Daftar Penjualan Kredit ({filteredCreditSales.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-gray-100 max-h-[80vh] overflow-y-auto credit-scroll-container">
          {filteredCreditSales.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Belum ada penjualan kredit</p>
              <p className="text-sm">
                {searchTerm || filterStatus !== 'all' 
                  ? "Tidak ada data yang sesuai dengan filter"
                  : "Penjualan kredit akan muncul di sini"
                }
              </p>
            </div>
          ) : (
            filteredCreditSales.map((credit) => {
              const statusInfo = getStatusInfo(credit.status, credit.due_date);
              const StatusIcon = statusInfo.icon;
              const progressPercentage = credit.total_amount > 0 
                ? (credit.amount_paid / credit.total_amount) * 100 
                : 0;
              const isOverdue = credit.due_date && new Date(credit.due_date) < new Date() && credit.status !== 'paid';
              const daysOverdue = isOverdue ? getDaysOverdue(credit.due_date!) : 0;
              const quickOptions = getQuickPaymentOptions(credit);
              const isSelected = selectedCredits.includes(credit.id);
              
              return (
                <div key={credit.id} className={`p-6 hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Selection Checkbox */}
                      <div className="pt-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCredits([...selectedCredits, credit.id]);
                            } else {
                              setSelectedCredits(selectedCredits.filter(id => id !== credit.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                        <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-800">
                            Invoice #{credit.sale_id}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                            {statusInfo.label}
                          </span>
                          {isOverdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              {daysOverdue} hari terlambat
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{credit.customer_name}</span>
                          {credit.customer_phone && (
                            <>
                              <span>•</span>
                              <span>{credit.customer_phone}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Total Tagihan</p>
                            <p className="font-semibold text-gray-800">{formatRupiah(credit.total_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Sudah Dibayar</p>
                            <p className="font-semibold text-green-600">{formatRupiah(credit.amount_paid)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Sisa Tagihan</p>
                            <p className="font-semibold text-red-600">{formatRupiah(credit.amount_remaining)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Tanggal Jatuh Tempo</p>
                            <p className="font-semibold text-gray-800">
                              {credit.due_date ? formatDate(credit.due_date) : 'Tidak ada'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress Pembayaran</span>
                            <span>{progressPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Quick Payment Options */}
                        {credit.status !== 'paid' && quickOptions.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Pembayaran Cepat:</p>
                            <div className="flex flex-wrap gap-2">
                              {quickOptions.slice(0, 4).map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => !isSubmitting && handleQuickPayment(credit, option.amount, option.percentage)}
                                  disabled={isSubmitting}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full hover:from-green-500 hover:to-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                  {isSubmitting ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <Zap className="w-3 h-3" />
                                  )}
                                  <span>{option.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {credit.payment_terms && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Syarat:</span> {credit.payment_terms}
                          </div>
                        )}
                        
                        {credit.notes && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Catatan:</span> {credit.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {credit.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => !isSubmitting && handleAddPayment(credit)}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Bayar</span>
                          </button>
                          
                          {isOverdue && (
                            <button
                              onClick={() => !isSubmitting && sendPaymentReminder(credit)}
                              disabled={isSubmitting}
                              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium shadow hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Bell className="w-4 h-4" />
                              <span>Remind</span>
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => !loadingPayments && handleShowPaymentHistory(credit.id)}
                        disabled={loadingPayments}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingPayments ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <History className="w-4 h-4" />
                        )}
                        <span>Riwayat</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment History */}
                  {showPaymentHistory === credit.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-bold text-gray-800 flex items-center space-x-2">
                          <History className="w-5 h-5 text-gray-600" />
                          <span>Riwayat Pembayaran</span>
                        </h5>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {payments.length} pembayaran
                        </span>
                      </div>
                      
                      {loadingPayments ? (
                        <div className="flex justify-center py-8">
                          <div className="flex items-center space-x-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-sm text-gray-600">Memuat riwayat...</span>
                          </div>
                        </div>
                      ) : payments.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <History className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-medium">Belum ada pembayaran</p>
                          <p className="text-sm text-gray-500">Riwayat pembayaran akan muncul di sini</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {payments.map((payment) => {
                            const methodInfo = getPaymentMethodInfo(payment.payment_method);
                            const MethodIcon = methodInfo.icon;
                            
                            return (
                              <div key={payment.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 text-green-600`}>
                                      <MethodIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <p className="font-semibold text-gray-800 text-sm">
                                          Pembayaran #{payment.id}
                                        </p>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {methodInfo.label}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                                        <span className="flex items-center space-x-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>{formatDate(payment.payment_date)}</span>
                                        </span>
                                        {payment.reference_number && (
                                          <span className="flex items-center space-x-1">
                                            <Receipt className="w-3 h-3" />
                                            <span>{payment.reference_number}</span>
                                          </span>
                                        )}
                                      </div>
                                      {payment.notes && (
                                        <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">
                                      {formatRupiah(payment.payment_amount)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatDate(payment.created_at)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedCredit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-backdrop flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="absolute inset-0" onClick={() => !isSubmitting && resetPaymentForm()}></div>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl my-8 max-h-[90vh] overflow-y-auto relative z-10 credit-scroll-container">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Catat Pembayaran</h2>
                <p className="text-sm text-gray-600">
                  Invoice #{selectedCredit.sale_id} - {selectedCredit.customer_name}
                </p>
              </div>
            </div>
            
            {/* Credit Info */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Tagihan:</span>
                  <p className="font-semibold text-gray-800">{formatRupiah(selectedCredit.total_amount)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Sudah Dibayar:</span>
                  <p className="font-semibold text-green-600">{formatRupiah(selectedCredit.amount_paid)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Sisa Tagihan:</span>
                  <p className="font-semibold text-red-600 text-lg">{formatRupiah(selectedCredit.amount_remaining)}</p>
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pilihan Cepat
              </label>
              <div className="grid grid-cols-3 gap-2">
                {getQuickPaymentOptions(selectedCredit).slice(0, 6).map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPaymentFormData({ ...paymentFormData, payment_amount: option.amount })}
                    className={`p-2 rounded-lg border transition-all text-sm font-medium ${
                      paymentFormData.payment_amount === option.amount
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {option.label}
                    <div className="text-xs text-gray-500 mt-1">
                      {formatRupiah(option.amount)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Pembayaran (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedCredit.amount_remaining}
                  step="0.01"
                  required
                  value={paymentFormData.payment_amount || ''}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-lg font-semibold"
                  placeholder="0"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Minimum: Rp 0</span>
                  <span>Maksimum: {formatRupiah(selectedCredit.amount_remaining)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Metode Pembayaran *
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {(['cash', 'transfer', 'credit'] as const).map((method) => {
                      const methodInfo = getPaymentMethodInfo(method);
                      const MethodIcon = methodInfo.icon;
                      
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentFormData({ ...paymentFormData, payment_method: method })}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            paymentFormData.payment_method === method 
                              ? 'border-green-500 bg-green-50 text-green-700' 
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <MethodIcon className="w-5 h-5" />
                            <span className="font-medium">{methodInfo.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Pembayaran *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentFormData.payment_date}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  value={paymentFormData.reference_number}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reference_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Nomor transaksi, cek, dll (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  rows={3}
                  placeholder="Catatan pembayaran (opsional)"
                />
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => !isSubmitting && resetPaymentForm()}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !paymentFormData.payment_amount || paymentFormData.payment_amount <= 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Catat Pembayaran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Payment Modal */}
      {showBatchPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-backdrop flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="absolute inset-0" onClick={() => !isSubmitting && setShowBatchPayment(false)}></div>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl my-8 max-h-[90vh] overflow-y-auto relative z-10 credit-scroll-container">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Batch Payment</h2>
                <p className="text-sm text-gray-600">{selectedCredits.length} transaksi dipilih</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah per Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg font-semibold"
                  placeholder="0"
                  id="batchAmount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  rows={3}
                  placeholder="Catatan untuk semua pembayaran"
                  id="batchNotes"
                />
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  onClick={() => !isSubmitting && setShowBatchPayment(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (isSubmitting) return;
                    const amount = parseFloat((document.getElementById('batchAmount') as HTMLInputElement).value);
                    const notes = (document.getElementById('batchNotes') as HTMLTextAreaElement).value;
                    if (amount > 0) {
                      handleBatchPayment(amount, notes);
                    } else {
                      alert("Masukkan jumlah pembayaran yang valid");
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Proses Batch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
