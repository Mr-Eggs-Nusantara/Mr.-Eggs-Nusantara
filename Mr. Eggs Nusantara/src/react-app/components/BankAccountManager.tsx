import { useState } from "react";
import { useApi, apiPost } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  Plus, 
  Trash2, 
  Building2,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Settings,
  Landmark,
  DollarSign,
  Activity,
  Calendar,
  Hash,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  PiggyBank
} from "lucide-react";

interface BankAccount {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: string;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface BankTransaction {
  id: number;
  bank_account_id: number;
  transaction_type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference_number?: string;
  transaction_date: string;
  balance_after: number;
  financial_transaction_id?: number;
  bank_name: string;
  account_name: string;
  created_at: string;
}

interface NewBankAccount {
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: string;
  current_balance: number;
  is_active: boolean;
  notes: string;
}

interface NewBankTransaction {
  bank_account_id: number;
  transaction_type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference_number: string;
  transaction_date: string;
  category: string;
  create_financial_transaction: boolean;
}

export default function BankAccountManager() {
  const { data: accounts, loading, error, refetch } = useApi<BankAccount[]>("/bank-accounts", []);
  
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showTransactions, setShowTransactions] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [showBalances, setShowBalances] = useState(false);
  const [showIndividualBalance, setShowIndividualBalance] = useState<{ [key: number]: boolean }>({});
  
  const [accountFormData, setAccountFormData] = useState<NewBankAccount>({
    bank_name: '',
    account_name: '',
    account_number: '',
    account_type: 'checking',
    current_balance: 0,
    is_active: true,
    notes: ''
  });

  const [transactionFormData, setTransactionFormData] = useState<NewBankTransaction>({
    bank_account_id: 0,
    transaction_type: 'credit',
    amount: 0,
    description: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
    category: '',
    create_financial_transaction: true
  });

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accountTypes = [
    { value: 'checking', label: 'Rekening Giro' },
    { value: 'savings', label: 'Tabungan' },
    { value: 'business', label: 'Rekening Bisnis' },
    { value: 'investment', label: 'Investasi' },
    { value: 'other', label: 'Lainnya' }
  ];

  const transactionCategories = {
    credit: [
      { value: 'bank_deposit', label: 'Setoran Tunai' },
      { value: 'transfer_in', label: 'Transfer Masuk' },
      { value: 'sales', label: 'Penjualan' },
      { value: 'loan', label: 'Pinjaman' },
      { value: 'investment', label: 'Investasi' },
      { value: 'other_income', label: 'Pendapatan Lain' }
    ],
    debit: [
      { value: 'bank_withdrawal', label: 'Penarikan Tunai' },
      { value: 'transfer_out', label: 'Transfer Keluar' },
      { value: 'purchase', label: 'Pembelian' },
      { value: 'operational', label: 'Operasional' },
      { value: 'salary', label: 'Gaji' },
      { value: 'utilities', label: 'Utilitas' },
      { value: 'loan_payment', label: 'Pembayaran Pinjaman' },
      { value: 'other_expense', label: 'Pengeluaran Lain' }
    ]
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

  

  const getBankIcon = (bankName: string) => {
    const name = bankName.toLowerCase();
    if (name.includes('mandiri') || name.includes('bca') || name.includes('bni') || name.includes('bri')) {
      return Landmark;
    } else if (name.includes('digital') || name.includes('dana') || name.includes('ovo') || name.includes('gopay')) {
      return Wallet;
    } else if (name.includes('syariah') || name.includes('muamalat')) {
      return Building2;
    }
    return CreditCard;
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      'checking': 'from-blue-400 to-blue-600',
      'savings': 'from-green-400 to-green-600', 
      'business': 'from-purple-400 to-purple-600',
      'investment': 'from-orange-400 to-orange-600',
      'other': 'from-gray-400 to-gray-600'
    };
    return colors[type as keyof typeof colors] || 'from-indigo-400 to-indigo-600';
  };

  const toggleIndividualBalance = (accountId: number) => {
    setShowIndividualBalance(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const isBalanceVisible = (accountId: number) => {
    return showBalances || showIndividualBalance[accountId];
  };

  const resetAccountForm = () => {
    setAccountFormData({
      bank_name: '',
      account_name: '',
      account_number: '',
      account_type: 'checking',
      current_balance: 0,
      is_active: true,
      notes: ''
    });
    setEditingAccount(null);
    setShowAccountForm(false);
  };

  const resetTransactionForm = () => {
    setTransactionFormData({
      bank_account_id: 0,
      transaction_type: 'credit',
      amount: 0,
      description: '',
      reference_number: '',
      transaction_date: new Date().toISOString().split('T')[0],
      category: '',
      create_financial_transaction: true
    });
    setShowTransactionForm(false);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountFormData.bank_name || !accountFormData.account_name || !accountFormData.account_number) {
      alert("Harap isi semua field yang wajib");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingAccount) {
        await fetch(`/api/bank-accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountFormData)
        });
        alert("Rekening bank berhasil diperbarui!");
      } else {
        await apiPost("/bank-accounts", accountFormData);
        alert("Rekening bank berhasil ditambahkan!");
      }
      
      await refetch();
      resetAccountForm();
    } catch (error) {
      console.error("Error saving bank account:", error);
      alert("Terjadi kesalahan saat menyimpan rekening bank");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionFormData.bank_account_id || !transactionFormData.description || transactionFormData.amount <= 0) {
      alert("Harap isi semua field dengan benar");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiPost("/bank-transactions", transactionFormData);
      await refetch(); // Refresh account balances
      
      // Refresh transactions if currently viewing
      if (showTransactions === transactionFormData.bank_account_id) {
        await loadTransactions(transactionFormData.bank_account_id);
      }
      
      resetTransactionForm();
      alert("Transaksi bank berhasil dicatat!");
    } catch (error) {
      console.error("Error saving bank transaction:", error);
      alert("Terjadi kesalahan saat mencatat transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setAccountFormData({
      bank_name: account.bank_name,
      account_name: account.account_name,
      account_number: account.account_number,
      account_type: account.account_type,
      current_balance: account.current_balance,
      is_active: account.is_active,
      notes: account.notes || ''
    });
    setShowAccountForm(true);
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus rekening ini?")) return;
    
    try {
      await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' });
      await refetch();
      alert("Rekening berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Terjadi kesalahan saat menghapus rekening");
    }
  };

  const loadTransactions = async (accountId: number) => {
    setLoadingTransactions(true);
    try {
      const response = await fetch(`/api/bank-accounts/${accountId}/transactions`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleShowTransactions = async (accountId: number) => {
    if (showTransactions === accountId) {
      setShowTransactions(null);
      setTransactions([]);
    } else {
      setShowTransactions(accountId);
      await loadTransactions(accountId);
    }
  };

  const handleAddTransaction = (accountId: number) => {
    setTransactionFormData({
      ...transactionFormData,
      bank_account_id: accountId
    });
    setShowTransactionForm(true);
  };

  const totalBalance = accounts.filter(acc => acc.is_active).reduce((sum, acc) => sum + acc.current_balance, 0);

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
          Error loading bank accounts: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Total Balance */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Total Saldo Bank</h3>
                <p className="text-blue-100 text-sm">{accounts.filter(acc => acc.is_active).length} rekening aktif</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBalances(!showBalances)}
                className="group p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                title={showBalances ? "Sembunyikan semua saldo" : "Tampilkan semua saldo"}
              >
                {showBalances ? (
                  <EyeOff className="w-5 h-5 group-hover:text-yellow-200 transition-colors duration-200" />
                ) : (
                  <Eye className="w-5 h-5 group-hover:text-yellow-200 transition-colors duration-200" />
                )}
              </button>
              <div className="text-xs text-blue-100">
                {showBalances ? "Semua saldo terlihat" : "Saldo tersembunyi"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-4xl font-bold tracking-tight transition-all duration-300">
              {showBalances ? (
                <span className="animate-fade-in">{formatRupiah(totalBalance)}</span>
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
                    <p className="text-xs text-blue-200">Rekening Aktif</p>
                    <p className="text-lg font-semibold">{accounts.filter(acc => acc.is_active).length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-400/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200">Total Bank</p>
                    <p className="text-lg font-semibold">{new Set(accounts.map(acc => acc.bank_name)).size}</p>
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
          onClick={() => setShowAccountForm(true)}
          className="group bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
        >
          <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-3 h-3" />
          </div>
          <span>Tambah Rekening</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refetch}
            disabled={loading}
            className="bg-white/70 backdrop-blur-sm border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl font-medium hover:bg-white hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:block">Refresh</span>
          </button>
          
          <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm border border-gray-200 px-4 py-3 rounded-2xl">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200"
              title={showBalances ? "Sembunyikan semua saldo" : "Tampilkan semua saldo"}
            >
              {showBalances ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="text-sm font-medium hidden sm:block">
                {showBalances ? 'Sembunyikan' : 'Tampilkan'} Saldo
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bank Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <div className="absolute top-4 right-1/2 transform translate-x-8">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Belum Ada Rekening Bank</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Mulai kelola keuangan dengan menambahkan rekening bank pertama Anda
            </p>
            <button
              onClick={() => setShowAccountForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Rekening Pertama</span>
            </button>
          </div>
        ) : (
          accounts.map((account) => {
            const BankIcon = getBankIcon(account.bank_name);
            const gradientColor = getAccountTypeColor(account.account_type);
            
            return (
              <div
                key={account.id}
                className={`group relative bg-white rounded-3xl border shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                  account.is_active 
                    ? 'border-gray-200 hover:border-blue-300 hover:-translate-y-1' 
                    : 'border-gray-300 bg-gray-50 opacity-75'
                }`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Status Indicator */}
                {!account.is_active && (
                  <div className="absolute top-4 right-4 w-3 h-3 bg-gray-400 rounded-full"></div>
                )}
                {account.is_active && (
                  <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
                
                <div className="relative z-10 p-6">
                  {/* Account Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                        account.is_active 
                          ? `bg-gradient-to-br ${gradientColor} text-white`
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        <BankIcon className="w-7 h-7" />
                        {account.is_active && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg mb-1">{account.bank_name}</h4>
                        <p className="text-gray-600 font-medium">{account.account_name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            account.is_active 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {account.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleIndividualBalance(account.id)}
                        className="group/btn p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-110"
                        title={isBalanceVisible(account.id) ? "Sembunyikan saldo" : "Tampilkan saldo"}
                      >
                        {isBalanceVisible(account.id) ? (
                          <EyeOff className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                        ) : (
                          <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="group/btn p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-200" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="group/btn p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                      </button>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Nomor Rekening</span>
                        </div>
                      </div>
                      <div className="font-mono text-lg font-bold text-gray-800 transition-all duration-300">
                        {isBalanceVisible(account.id) ? (
                          <span className="animate-fade-in">{account.account_number}</span>
                        ) : (
                          <span className="tracking-wider">••••{account.account_number.slice(-4)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-600">Jenis</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {accountTypes.find(t => t.value === account.account_type)?.label || account.account_type}
                        </span>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-600">Dibuat</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatDate(account.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Balance Display */}
                    <div className={`relative rounded-2xl p-5 ${
                      account.current_balance >= 0 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                        : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            account.current_balance >= 0 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Saldo Saat Ini</p>
                            <div className={`text-2xl font-bold transition-all duration-300 ${
                              account.current_balance >= 0 ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {isBalanceVisible(account.id) ? (
                                <span className="animate-fade-in">{formatRupiah(account.current_balance)}</span>
                              ) : (
                                <span className="tracking-widest text-gray-400">Rp ••••••</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          account.current_balance >= 0 ? 'bg-green-400' : 'bg-red-400'
                        } animate-pulse`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddTransaction(account.id)}
                      className="group bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl hover:from-emerald-100 hover:to-green-100 transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-semibold hover:scale-105"
                    >
                      <div className="w-5 h-5 bg-emerald-200 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-200">
                        <Plus className="w-3 h-3" />
                      </div>
                      <span>Transaksi</span>
                    </button>
                    
                    <button
                      onClick={() => handleShowTransactions(account.id)}
                      className="group bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-semibold hover:scale-105"
                    >
                      <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span>Riwayat</span>
                      <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  </div>

                  {/* Transactions List */}
                  {showTransactions === account.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-bold text-gray-800 flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-gray-600" />
                          <span>Transaksi Terakhir</span>
                        </h5>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {transactions.length} transaksi
                        </span>
                      </div>
                      
                      {loadingTransactions ? (
                        <div className="flex justify-center py-8">
                          <div className="flex items-center space-x-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-sm text-gray-600">Memuat transaksi...</span>
                          </div>
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Activity className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-medium">Belum ada transaksi</p>
                          <p className="text-sm text-gray-500">Mulai catat transaksi untuk rekening ini</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {transactions.slice(0, 10).map((transaction) => (
                            <div key={transaction.id} className="group relative bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-200">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    transaction.transaction_type === 'credit' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-red-100 text-red-600'
                                  }`}>
                                    {transaction.transaction_type === 'credit' ? (
                                      <ArrowUpRight className="w-5 h-5" />
                                    ) : (
                                      <ArrowDownRight className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="font-semibold text-gray-800 text-sm">{transaction.description}</p>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        transaction.transaction_type === 'credit' 
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {transaction.transaction_type === 'credit' ? 'Masuk' : 'Keluar'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                                      <span className="flex items-center space-x-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatDate(transaction.transaction_date)}</span>
                                      </span>
                                      {transaction.reference_number && (
                                        <span className="flex items-center space-x-1">
                                          <Hash className="w-3 h-3" />
                                          <span>{transaction.reference_number}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${
                                    transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {transaction.transaction_type === 'credit' ? '+' : '-'}{formatRupiah(transaction.amount)}
                                  </div>
                                  <div className="text-xs text-gray-500 transition-all duration-300">
                                    Saldo: {isBalanceVisible(account.id) ? (
                                      <span className="animate-fade-in">{formatRupiah(transaction.balance_after)}</span>
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
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Account Form Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
                </h2>
                <p className="text-sm text-gray-600">
                  {editingAccount ? 'Perbarui informasi rekening' : 'Tambahkan rekening bank baru'}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleAccountSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Bank *
                  </label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={accountFormData.bank_name}
                      onChange={(e) => setAccountFormData({ ...accountFormData, bank_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Contoh: Bank Mandiri, BCA, BRI"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Rekening *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountFormData.account_name}
                    onChange={(e) => setAccountFormData({ ...accountFormData, account_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Nama pemilik rekening"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nomor Rekening *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={accountFormData.account_number}
                      onChange={(e) => setAccountFormData({ ...accountFormData, account_number: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono transition-all duration-200"
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jenis Rekening
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={accountFormData.account_type}
                      onChange={(e) => setAccountFormData({ ...accountFormData, account_type: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-all duration-200"
                    >
                      {accountTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Saldo Awal (Rp)
                  </label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      value={accountFormData.current_balance || ''}
                      onChange={(e) => setAccountFormData({ ...accountFormData, current_balance: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={accountFormData.notes}
                  onChange={(e) => setAccountFormData({ ...accountFormData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  rows={3}
                  placeholder="Catatan opsional tentang rekening ini"
                />
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={accountFormData.is_active}
                  onChange={(e) => setAccountFormData({ ...accountFormData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                />
                <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700">
                  Rekening aktif
                </label>
                <div className="ml-2">
                  {accountFormData.is_active ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={resetAccountForm}
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
                      <span>{editingAccount ? 'Perbarui' : 'Simpan'} Rekening</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Catat Transaksi Bank</h2>
            
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rekening Bank *
                </label>
                <select
                  required
                  value={transactionFormData.bank_account_id}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, bank_account_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>Pilih rekening</option>
                  {accounts.filter(acc => acc.is_active).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Transaksi *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTransactionFormData({ ...transactionFormData, transaction_type: 'credit', category: '' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      transactionFormData.transaction_type === 'credit' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Kredit (Masuk)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionFormData({ ...transactionFormData, transaction_type: 'debit', category: '' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      transactionFormData.transaction_type === 'debit' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Debit (Keluar)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <select
                  required
                  value={transactionFormData.category}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih kategori</option>
                  {transactionCategories[transactionFormData.transaction_type].map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi *
                </label>
                <input
                  type="text"
                  required
                  value={transactionFormData.description}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deskripsi transaksi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={transactionFormData.amount || ''}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  value={transactionFormData.reference_number}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nomor referensi (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Transaksi *
                </label>
                <input
                  type="date"
                  required
                  value={transactionFormData.transaction_date}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, transaction_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create_financial_transaction"
                  checked={transactionFormData.create_financial_transaction}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, create_financial_transaction: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="create_financial_transaction" className="ml-2 text-sm text-gray-700">
                  Catat juga di laporan keuangan
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetTransactionForm}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Catat Transaksi</span>
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
