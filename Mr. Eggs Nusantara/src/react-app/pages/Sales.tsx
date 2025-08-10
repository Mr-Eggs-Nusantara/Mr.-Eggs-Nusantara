import { useState, useEffect } from "react";
import { useApi, apiPost } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import ReceiptTemplate from "@/react-app/components/ReceiptTemplate";
import { 
  Plus, 
  Minus,
  Search, 
  Receipt, 
  DollarSign,
  User,
  ShoppingCart,
  CreditCard,
  Banknote,
  Building,
  Trash2,
  Package,
  AlertTriangle,
  Check,
  X,
  Calculator,
  Users,
  Store,
  Building2,
  RefreshCw,
  Smartphone,
  Zap,
  Landmark
} from "lucide-react";
import { Customer } from "@/shared/types";

interface Product {
  id: number;
  name: string;
  unit: string;
  selling_price: number;
  effective_price: number;
  minimum_quantity: number;
  stock_quantity: number;
  is_active: boolean;
}

interface CartItem {
  id: string;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  stock_available: number;
}

interface BankAccount {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: string;
  current_balance: number;
  is_active: boolean;
}

interface TransactionData {
  id: number;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    unit: string;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  cash_received?: number;
  change?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_type: string;
  sale_date: string;
  created_at: string;
  bank_account?: string;
}

export default function Sales() {
  // State Management
  const [currentView, setCurrentView] = useState<'cashier' | 'history'>('cashier');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  // Customer & Pricing
  const [selectedCustomer, setSelectedCustomer] = useState<number>(0);
  const [customerType, setCustomerType] = useState<'umum' | 'toko' | 'grosir'>('umum');
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris' | 'edc' | 'credit'>('cash');
  const [selectedBankAccount, setSelectedBankAccount] = useState<number>(0);
  const [discount, setDiscount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  
  // Credit payment options
  const [creditTerms, setCreditTerms] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<TransactionData | null>(null);
  
  // Loading States
  const [productsLoading, setProductsLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(true);

  // API Hooks untuk sales history
  const { data: salesData, refetch: refetchSales } = useApi<any[]>("/sales", []);

  // Load Data Functions
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await fetch(`/api/products-pricing/${customerType}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter((p: Product) => p.is_active && p.stock_quantity > 0));
      } else {
        setErrors(["Gagal memuat produk"]);
      }
    } catch (error) {
      setErrors(["Error memuat produk: " + (error as Error).message]);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCustomers = async () => {
    setCustomersLoading(true);
    setErrors([]); // Clear previous errors
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        const activeCustomers = data.filter((c: Customer) => c.is_active);
        setCustomers(activeCustomers);
        
        // If current selected customer is not in the filtered list, reset selection
        if (selectedCustomer > 0) {
          const customerExists = activeCustomers.some((c: Customer) => c.id === selectedCustomer);
          if (!customerExists) {
            setSelectedCustomer(0);
          }
        }
      } else {
        const errorText = response.status === 404 ? 'API endpoint tidak ditemukan' : 'Gagal memuat data pelanggan';
        setErrors([errorText]);
        setCustomers([]); // Reset customers on error
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setErrors(["Error koneksi: " + (error as Error).message]);
      setCustomers([]); // Reset customers on error
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    setBankAccountsLoading(true);
    try {
      const response = await fetch('/api/bank-accounts');
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.filter((acc: BankAccount) => acc.is_active));
      } else {
        console.error('Error loading bank accounts');
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    } finally {
      setBankAccountsLoading(false);
    }
  };

  const loadSales = async () => {
    setSalesLoading(true);
    try {
      await refetchSales();
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadProducts();
  }, [customerType]);

  useEffect(() => {
    // Load customers, bank accounts and sales on component mount
    loadCustomers();
    loadBankAccounts();
    loadSales();
  }, []);

  // Debug effect to monitor customer loading
  useEffect(() => {
    console.log('Customers state updated:', {
      customersCount: customers.length,
      customersLoading,
      selectedCustomer,
      customerType,
      errors
    });
  }, [customers, customersLoading, selectedCustomer, customerType, errors]);

  useEffect(() => {
    if (selectedCustomer > 0) {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer?.customer_type) {
        setCustomerType(customer.customer_type as 'umum' | 'toko' | 'grosir');
      }
    }
  }, [selectedCustomer, customers]);

  // Reset bank account selection when payment method changes
  useEffect(() => {
    if (paymentMethod === 'cash' || paymentMethod === 'credit') {
      setSelectedBankAccount(0);
    }
  }, [paymentMethod]);

  // Get filtered customers based on current type
  const getFilteredCustomers = () => {
    if (customers.length === 0) return [];
    
    // Show all customers but organize by preference
    return customers.filter(c => {
      // If customer has no type set, show in all categories
      if (!c.customer_type) return true;
      // Show customers matching current type
      return c.customer_type === customerType;
    }).sort((a, b) => {
      // Sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  // Helper Functions
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const generateCartId = () => Math.random().toString(36).substr(2, 9);

  // Cart Functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: generateCartId(),
        product_id: product.id,
        product_name: product.name,
        unit_price: product.effective_price || product.selling_price,
        quantity: Math.max(1, product.minimum_quantity || 1),
        unit: product.unit,
        minimum_quantity: product.minimum_quantity || 1,
        stock_available: product.stock_quantity
      };
      setCart(prev => [...prev, newItem]);
    }
    clearErrors();
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item.id !== cartItemId));
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const validQuantity = Math.max(1, Math.min(newQuantity, item.stock_available));
        return { ...item, quantity: validQuantity };
      }
      return item;
    }));
    clearErrors();
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    clearErrors();
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashReceived(0);
    setSelectedBankAccount(0);
    setCreditTerms('');
    setDueDate('');
    clearErrors();
  };

  // Calculation Functions
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - discount);
  };

  const calculateChange = () => {
    if (paymentMethod !== 'cash') return 0;
    return Math.max(0, cashReceived - calculateTotal());
  };

  // Validation Functions
  const validateCart = (): string[] => {
    const validationErrors: string[] = [];

    if (cart.length === 0) {
      validationErrors.push("Keranjang masih kosong");
      return validationErrors;
    }

    cart.forEach(item => {
      if (item.quantity < item.minimum_quantity) {
        validationErrors.push(
          `${item.product_name}: Minimum pembelian ${item.minimum_quantity} ${item.unit}`
        );
      }
      if (item.quantity > item.stock_available) {
        validationErrors.push(
          `${item.product_name}: Stok tidak mencukupi (tersedia: ${item.stock_available})`
        );
      }
    });

    if (calculateTotal() <= 0) {
      validationErrors.push("Total pembayaran harus lebih dari Rp 0");
    }

    if (paymentMethod === 'cash' && cashReceived < calculateTotal()) {
      validationErrors.push("Uang yang diterima kurang dari total pembayaran");
    }

    if (['transfer', 'qris', 'edc'].includes(paymentMethod) && !selectedBankAccount) {
      validationErrors.push("Rekening tujuan harus dipilih untuk pembayaran non-tunai");
    }

    if (paymentMethod === 'credit') {
      if (!selectedCustomer) {
        validationErrors.push("Customer harus dipilih untuk penjualan kredit");
      }
      if (!dueDate) {
        validationErrors.push("Tanggal jatuh tempo harus diisi untuk penjualan kredit");
      }
    }

    return validationErrors;
  };

  const clearErrors = () => setErrors([]);

  // Transaction Functions
  const processSale = async () => {
    const validationErrors = validateCart();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      const saleData = {
        customer_id: selectedCustomer || undefined,
        sale_date: new Date().toISOString().split('T')[0],
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: 0
        })),
        discount_amount: discount,
        tax_amount: 0,
        payment_method: paymentMethod,
        payment_terms: paymentMethod === 'credit' ? creditTerms : undefined,
        due_date: paymentMethod === 'credit' ? dueDate : undefined,
        bank_account_id: selectedBankAccount || undefined,
        notes: `Kasir - ${cart.length} item(s) - ${paymentMethod}${paymentMethod === 'credit' ? ` (Jatuh tempo: ${dueDate})` : ''}${selectedBankAccount ? ` (Rekening: ${bankAccounts.find(acc => acc.id === selectedBankAccount)?.bank_name})` : ''}`
      };

      const result = await apiPost("/sales", saleData);

      // Handle cash transactions to petty cash
      if (paymentMethod === 'cash' && result.success) {
        const pettyCashData = {
          transaction_type: 'in',
          amount: calculateTotal(),
          description: `Penjualan tunai - Invoice #${result.id}`,
          transaction_date: new Date().toISOString().split('T')[0],
          reference_number: `INV-${result.id}`
        };
        
        try {
          await apiPost("/petty-cash", pettyCashData);
        } catch (error) {
          console.warn("Failed to record petty cash transaction:", error);
        }
      }

      // Handle non-cash payments to bank accounts
      if (['transfer', 'qris', 'edc'].includes(paymentMethod) && selectedBankAccount && result.success) {
        const bankTransactionData = {
          bank_account_id: selectedBankAccount,
          transaction_type: 'credit',
          amount: calculateTotal(),
          description: `Penjualan ${getPaymentMethodInfo(paymentMethod).label} - Invoice #${result.id}`,
          transaction_date: new Date().toISOString().split('T')[0],
          reference_number: `INV-${result.id}`,
          category: `sales_${paymentMethod}`,
          create_financial_transaction: true
        };
        
        try {
          await apiPost("/bank-transactions", bankTransactionData);
        } catch (error) {
          console.warn("Failed to record bank transaction:", error);
        }
      }

      // Prepare receipt data
      const customer = customers.find(c => c.id === selectedCustomer);
      const bankAccount = bankAccounts.find(acc => acc.id === selectedBankAccount);
      
      const receiptData: TransactionData = {
        id: result.id || Date.now(),
        items: cart.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit: item.unit,
          total: item.quantity * item.unit_price
        })),
        subtotal: calculateSubtotal(),
        discount: discount,
        total: calculateTotal(),
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? cashReceived : undefined,
        change: paymentMethod === 'cash' ? calculateChange() : undefined,
        customer_name: customer?.name || 'Customer Umum',
        customer_phone: customer?.phone,
        customer_type: customerType,
        sale_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        bank_account: bankAccount ? `${bankAccount.bank_name} - ${bankAccount.account_name}` : undefined
      };

      // Success actions
      setLastTransaction(receiptData);
      setShowReceipt(true);
      clearCart();
      setSelectedCustomer(0);
      setCreditTerms('');
      setDueDate('');
      
      // Reload data
      await Promise.all([loadProducts(), loadSales(), loadBankAccounts()]);

    } catch (error) {
      setErrors(["Gagal memproses transaksi: " + (error as Error).message]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick amount calculations for cash payment
  const getQuickAmounts = () => {
    const total = calculateTotal();
    const amounts = [
      Math.ceil(total / 1000) * 1000,
      Math.ceil(total / 5000) * 5000,
      Math.ceil(total / 10000) * 10000,
      Math.ceil(total / 50000) * 50000
    ];
    return [...new Set(amounts)].filter(amount => amount >= total).slice(0, 4);
  };

  // Filter products by search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // UI Helper Functions
  const getCustomerTypeInfo = (type: string) => {
    switch (type) {
      case 'umum':
        return { label: 'Umum', icon: Users, bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200' };
      case 'toko':
        return { label: 'Toko', icon: Store, bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200' };
      case 'grosir':
        return { label: 'Grosir', icon: Building2, bgColor: 'bg-purple-50', textColor: 'text-purple-800', borderColor: 'border-purple-200' };
      default:
        return { label: 'Umum', icon: Users, bgColor: 'bg-gray-50', textColor: 'text-gray-800', borderColor: 'border-gray-200' };
    }
  };

  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'cash':
        return { label: 'Tunai', icon: Banknote, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'transfer':
        return { label: 'Transfer', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'qris':
        return { label: 'QRIS', icon: Smartphone, color: 'text-purple-600', bgColor: 'bg-purple-50' };
      case 'edc':
        return { label: 'EDC', icon: Zap, color: 'text-orange-600', bgColor: 'bg-orange-50' };
      case 'credit':
        return { label: 'Kredit', icon: Building, color: 'text-red-600', bgColor: 'bg-red-50' };
      default:
        return { label: method, icon: DollarSign, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  // Show loading state for initial load only
  if (productsLoading && customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Memuat sistem kasir...</span>
      </div>
    );
  }

  // Calculate today's stats
  const todaySales = salesData?.filter(s => 
    s.sale_date === new Date().toISOString().split('T')[0]
  ) || [];
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.final_amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display text-gray-800 mb-2">💳 Sistem Kasir</h1>
            <p className="text-gray-600 font-body">Penjualan dengan sistem harga bertingkat</p>
          </div>
          
          {/* View Toggle & Stats */}
          <div className="flex items-center space-x-4">
            {/* Today Stats */}
            <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-200 text-center">
              <p className="text-xs text-green-600 font-medium font-heading">Penjualan Hari Ini</p>
              <p className="text-lg font-bold font-tabular text-green-800">{todaySales.length}</p>
              <p className="text-xs text-green-700 font-tabular">{formatRupiah(todayRevenue)}</p>
            </div>

            {/* Customer Type Indicator */}
            {(() => {
              const typeInfo = getCustomerTypeInfo(customerType);
              const TypeIcon = typeInfo.icon;
              return (
                <div className={`${typeInfo.bgColor} rounded-xl px-4 py-3 border ${typeInfo.borderColor} text-center`}>
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <TypeIcon className="w-4 h-4" />
                    <p className={`text-xs ${typeInfo.textColor} font-medium`}>Mode Kasir</p>
                  </div>
                  <p className={`text-sm font-bold ${typeInfo.textColor}`}>{typeInfo.label}</p>
                </div>
              );
            })()}

            {/* View Toggle */}
            <button
              onClick={() => setCurrentView(currentView === 'cashier' ? 'history' : 'cashier')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                currentView === 'cashier'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
              }`}
            >
              {currentView === 'cashier' ? (
                <>
                  <Receipt className="w-5 h-5" />
                  <span>Riwayat</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Kasir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {currentView === 'cashier' ? (
        /* CASHIER VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Products & Search */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <span>Pilih Produk ({filteredProducts.length})</span>
                </h3>
                <button
                  onClick={loadProducts}
                  disabled={productsLoading}
                  className="flex items-center space-x-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                  <span className="ml-3 text-gray-600">Memuat produk...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    {searchTerm ? "Produk tidak ditemukan" : "Tidak ada produk tersedia"}
                  </p>
                  <p className="text-sm mt-2">
                    {searchTerm ? "Coba kata kunci lain" : "Periksa stok atau tambah produk baru"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-amber-100 transition-all duration-200 text-left group hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs bg-white px-2 py-1 rounded text-gray-600">
                          Stok: {product.stock_quantity}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-orange-700">
                        {product.name}
                      </h4>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-orange-600">
                            {formatRupiah(product.effective_price || product.selling_price)}
                          </span>
                          {product.effective_price !== product.selling_price && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                              Hemat!
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          per {product.unit}
                        </div>
                        
                        {product.minimum_quantity > 1 && (
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Min: {product.minimum_quantity} {product.unit}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <span>Pelanggan</span>
                </h3>
                <button
                  onClick={loadCustomers}
                  disabled={customersLoading}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  title="Refresh data pelanggan"
                >
                  <RefreshCw className={`w-4 h-4 ${customersLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              
              {/* Customer Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Harga</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['umum', 'toko', 'grosir'] as const).map((type) => {
                    const typeInfo = getCustomerTypeInfo(type);
                    const TypeIcon = typeInfo.icon;
                    const matchingCustomers = customers.filter(c => c.customer_type === type || (!c.customer_type && type === 'umum'));
                    
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setCustomerType(type);
                        }}
                        disabled={customersLoading}
                        className={`p-2 rounded-lg border-2 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                          customerType === type 
                            ? 'border-orange-500 bg-orange-50 text-orange-700' 
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <TypeIcon className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs font-semibold">{typeInfo.label}</span>
                        {!customersLoading && (
                          <div className="text-xs text-gray-500 mt-1">
                            {matchingCustomers.length} customer
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Customer Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Pilih Pelanggan (Opsional)
                  </label>
                  {!customersLoading && customers.length > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ {customers.length} loaded
                    </span>
                  )}
                </div>
                
                {customersLoading ? (
                  <div className="flex items-center space-x-2 px-3 py-3 border border-gray-200 rounded-lg bg-gray-50">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-gray-600">Memuat pelanggan...</span>
                  </div>
                ) : errors.length > 0 ? (
                  <div className="px-3 py-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600">Error: {errors[0]}</span>
                      <button
                        onClick={loadCustomers}
                        className="text-xs text-red-700 hover:text-red-900 font-medium underline"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedCustomer}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        setSelectedCustomer(newValue);
                      }}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 font-medium transition-colors"
                    >
                      <option value={0} className="text-gray-700">🏪 Customer Umum (Walk-in)</option>
                      {getFilteredCustomers().map(customer => {
                        const customerTypeIcon = customer.customer_type === 'toko' ? '🏬' : 
                                               customer.customer_type === 'grosir' ? '🏭' : '👤';
                        const customerTypeLabel = customer.customer_type ? 
                          `(${getCustomerTypeInfo(customer.customer_type).label})` : '(Umum)';
                        
                        return (
                          <option key={customer.id} value={customer.id} className="text-gray-800">
                            {customerTypeIcon} {customer.name} {customerTypeLabel}
                            {customer.phone && ` - ${customer.phone}`}
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Enhanced Customer Info */}
                    <div className="mt-2 space-y-1">
                      {selectedCustomer > 0 && (() => {
                        const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
                        if (selectedCustomerData) {
                          return (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-800">
                                  🎯 {selectedCustomerData.name}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  selectedCustomerData.customer_type === 'grosir' ? 'bg-purple-100 text-purple-800' :
                                  selectedCustomerData.customer_type === 'toko' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {getCustomerTypeInfo(selectedCustomerData.customer_type || 'umum').label}
                                </span>
                              </div>
                              {selectedCustomerData.phone && (
                                <div className="text-xs text-blue-600 mt-1">
                                  📞 {selectedCustomerData.phone}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {customers.length === 0 
                            ? "⚠️ Belum ada pelanggan. Tambah di menu Pelanggan."
                            : `📊 ${getFilteredCustomers().length} pelanggan cocok untuk ${getCustomerTypeInfo(customerType).label}`
                          }
                        </p>
                        
                        {customers.length > 0 && (
                          <button
                            onClick={loadCustomers}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            🔄 Refresh
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">Perhatian!</h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Shopping Cart */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-purple-500" />
                  <span>Keranjang ({cart.length})</span>
                </h3>
                
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Kosongkan keranjang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Keranjang kosong</p>
                    <p className="text-sm mt-1">Pilih produk untuk memulai</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const isUnderMinimum = item.quantity < item.minimum_quantity;
                    const isOverStock = item.quantity > item.stock_available;
                    const hasError = isUnderMinimum || isOverStock;
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-lg border transition-colors ${
                          hasError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate text-sm">
                              {item.product_name}
                            </p>
                            <p className="text-orange-600 font-semibold text-sm">
                              {formatRupiah(item.unit_price)} / {item.unit}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            
                            <span className={`w-12 text-center font-bold ${hasError ? 'text-red-600' : 'text-gray-800'}`}>
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                              disabled={item.quantity >= item.stock_available}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold font-tabular text-gray-800">
                              {formatRupiah(item.quantity * item.unit_price)}
                            </p>
                            {hasError && (
                              <p className="text-xs text-red-600 mt-1">
                                {isUnderMinimum && `Min: ${item.minimum_quantity}`}
                                {isOverStock && `Maks: ${item.stock_available}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Discount */}
              {cart.length > 0 && (
                <div className="border-t pt-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={calculateSubtotal()}
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0"
                  />
                </div>
              )}

              {/* Totals */}
              {cart.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatRupiah(calculateSubtotal())}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Diskon:</span>
                      <span className="font-medium">-{formatRupiah(discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xl font-bold font-heading text-gray-800 pt-2 border-t">
                    <span>TOTAL:</span>
                    <span className="text-green-600 font-tabular">{formatRupiah(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Section */}
            {cart.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-green-500" />
                  <span>Pembayaran</span>
                </h3>
                
                {/* Payment Method Selection */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {(['cash', 'transfer', 'qris', 'edc', 'credit'] as const).map((method) => {
                    const methodInfo = getPaymentMethodInfo(method);
                    const MethodIcon = methodInfo.icon;
                    
                    return (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method);
                          setCashReceived(0);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          paymentMethod === method 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <MethodIcon className={`w-5 h-5 mx-auto mb-1 ${
                          paymentMethod === method ? 'text-orange-600' : 'text-gray-600'
                        }`} />
                        <span className={`text-xs font-medium ${
                          paymentMethod === method ? 'text-orange-800' : 'text-gray-700'
                        }`}>
                          {methodInfo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bank Account Selection for Non-Cash Payments */}
                {['transfer', 'qris', 'edc'].includes(paymentMethod) && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Rekening Tujuan *
                    </label>
                    {bankAccountsLoading ? (
                      <div className="flex items-center space-x-2 px-3 py-3 border border-blue-300 rounded-lg bg-blue-100">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-blue-600">Memuat rekening...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedBankAccount}
                        onChange={(e) => setSelectedBankAccount(parseInt(e.target.value))}
                        className="w-full px-3 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value={0}>Pilih rekening tujuan</option>
                        {bankAccounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.bank_name} - {account.account_name} ({account.account_number})
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {selectedBankAccount > 0 && (() => {
                      const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccount);
                      if (selectedAccount) {
                        return (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-blue-800">
                                <Landmark className="w-4 h-4 inline mr-2" />
                                {selectedAccount.bank_name}
                              </span>
                              <span className="font-mono text-blue-600">
                                {selectedAccount.account_number}
                              </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              💰 Saldo: {formatRupiah(selectedAccount.current_balance)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
                
                {/* Credit Payment Terms */}
                {paymentMethod === 'credit' && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      Syarat Pembayaran
                    </label>
                    <input
                      type="text"
                      value={creditTerms}
                      onChange={(e) => setCreditTerms(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-3"
                      placeholder="Contoh: Net 30 hari, cicilan 3x, dll"
                    />
                    
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      Tanggal Jatuh Tempo *
                    </label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    
                    {dueDate && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                        <div className="flex justify-between items-center">
                          <span className="text-red-800 font-medium">Jatuh Tempo:</span>
                          <span className="text-lg font-bold text-red-800">
                            {new Date(dueDate).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          Customer: {selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : 'Pilih customer terlebih dahulu'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cash Payment Calculator */}
                {paymentMethod === 'cash' && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-green-700">
                        Uang Diterima
                      </label>
                      <span className="text-xs text-green-600 font-medium">
                        💰 Akan masuk ke Kas Kecil
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={cashReceived || ''}
                      onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                      placeholder="Masukkan jumlah uang..."
                    />
                    
                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {getQuickAmounts().map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setCashReceived(amount)}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                        >
                          {formatRupiah(amount)}
                        </button>
                      ))}
                    </div>
                    
                    {/* Change Display */}
                    {cashReceived > 0 && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">Kembalian:</span>
                          <span className={`text-xl font-bold ${
                            calculateChange() >= 0 ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {formatRupiah(calculateChange())}
                          </span>
                        </div>
                        {calculateChange() < 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            Uang kurang {formatRupiah(Math.abs(calculateChange()))}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Process Payment Button */}
                <button
                  onClick={processSale}
                  disabled={isProcessing || validateCart().length > 0}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>MEMPROSES...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-6 h-6" />
                      <span className="font-tabular">BAYAR - {formatRupiah(calculateTotal())}</span>
                    </>
                  )}
                </button>
                
                {/* Payment Status */}
                {validateCart().length === 0 && cart.length > 0 && (
                  <div className="text-center mt-3">
                    <p className="text-sm text-green-600 flex items-center justify-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Siap diproses</span>
                      {paymentMethod === 'cash' && cashReceived > calculateTotal() && (
                        <span>(Kembalian: {formatRupiah(calculateChange())})</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SALES HISTORY VIEW */
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
              <Receipt className="w-6 h-6 text-orange-500" />
              <span>Riwayat Penjualan</span>
            </h3>
          </div>
          
          {salesLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Memuat riwayat...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pembayaran
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(salesData || []).slice(0, 50).map((sale: any) => {
                    const paymentInfo = getPaymentMethodInfo(sale.payment_method || 'cash');
                    const PaymentIcon = paymentInfo.icon;
                    
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            #INV-{sale.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {sale.customer_name || 'Customer Umum'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatRupiah(sale.final_amount || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <PaymentIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">
                              {paymentInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.created_at ? new Date(sale.created_at).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {(!salesData || salesData.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Belum ada transaksi</p>
                  <p className="text-sm">Mulai berjualan untuk melihat riwayat di sini</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <ReceiptTemplate
          data={lastTransaction}
          onPrint={() => window.print()}
          onWhatsApp={() => setShowReceipt(false)}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
