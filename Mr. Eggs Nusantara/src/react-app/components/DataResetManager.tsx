import { useState } from 'react';
import { usePermissions } from '@/react-app/hooks/usePermissions';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import {
  AlertTriangle,
  Trash2,
  Shield,
  Database,
  CheckCircle,
  Eye,
  RotateCcw,
  Clock,
  Receipt
} from 'lucide-react';

interface ResetPreview {
  transactional_data: {
    sales: number;
    sale_items: number;
    purchases: number;
    purchase_items: number;
    production_batches: number;
    production_inputs: number;
    production_outputs: number;
    financial_transactions: number;
    credit_sales: number;
    credit_payments: number;
    petty_cash: number;
    bank_transactions: number;
  };
  master_data: {
    products: number;
    raw_materials: number;
    customers: number;
    suppliers: number;
    employees: number;
    product_recipes: number;
    price_tiers: number;
  };
  will_be_reset: {
    bank_account_balances: number;
  };
  will_be_preserved: {
    app_users: string;
    system_settings: string;
    bank_accounts: string;
    todays_logs: string;
  };
}

interface DataResetManagerProps {
  onResetComplete?: () => void;
}

export default function DataResetManager({ onResetComplete }: DataResetManagerProps) {
  const { isSuperAdmin } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ResetPreview | null>(null);
  const [totalToDelete, setTotalToDelete] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(1);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [userConfirmation, setUserConfirmation] = useState('');
  const [resetInProgress, setResetInProgress] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);

  if (!isSuperAdmin()) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="text-lg font-heading font-semibold text-red-800">Akses Terbatas</h3>
            <p className="text-red-600">Fitur reset data hanya dapat diakses oleh Super Admin.</p>
          </div>
        </div>
      </div>
    );
  }

  const loadPreview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/reset-preview');
      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview);
        setTotalToDelete(data.total_records_to_delete);
        setShowPreview(true);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Preview load error:', error);
      alert('Gagal memuat preview data');
    } finally {
      setLoading(false);
    }
  };

  const executeReset = async () => {
    try {
      setResetInProgress(true);
      
      const resetData = {
        confirmation_code: confirmationCode,
        confirmation_timestamp: new Date().toISOString()
      };
      
      const response = await fetch('/api/system/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setResetResult(result);
        setShowConfirmation(false);
        setConfirmationStep(1);
        setConfirmationCode('');
        setUserConfirmation('');
        if (onResetComplete) onResetComplete();
      } else {
        const error = await response.json();
        alert(`Reset gagal: ${error.error}`);
      }
    } catch (error) {
      console.error('Reset execution error:', error);
      alert('Terjadi kesalahan saat melakukan reset');
    } finally {
      setResetInProgress(false);
    }
  };

  

  const formatDataLabel = (key: string) => {
    const labels: {[key: string]: string} = {
      sales: 'Penjualan',
      sale_items: 'Item Penjualan',
      purchases: 'Pembelian',
      purchase_items: 'Item Pembelian',
      production_batches: 'Batch Produksi',
      production_inputs: 'Input Produksi',
      production_outputs: 'Output Produksi',
      financial_transactions: 'Transaksi Keuangan',
      credit_sales: 'Penjualan Kredit',
      credit_payments: 'Pembayaran Kredit',
      petty_cash: 'Kas Kecil',
      bank_transactions: 'Transaksi Bank',
      products: 'Produk',
      raw_materials: 'Bahan Baku',
      customers: 'Pelanggan',
      suppliers: 'Supplier',
      employees: 'Karyawan',
      product_recipes: 'Resep Produk',
      price_tiers: 'Tingkat Harga',
      bank_account_balances: 'Saldo Rekening Bank'
    };
    return labels[key] || key;
  };

  if (resetResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-xl font-heading font-bold text-green-800">Reset Data Berhasil!</h2>
              <p className="text-green-600">Semua data transaksional dan master telah dihapus.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h3 className="font-heading font-semibold text-gray-800 mb-2">Total Data Dihapus</h3>
              <p className="text-2xl font-display font-bold text-green-600">{resetResult.total_deleted.toLocaleString()}</p>
              <p className="text-sm text-gray-600">records</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h3 className="font-heading font-semibold text-gray-800 mb-2">Waktu Reset</h3>
              <p className="text-sm text-gray-700">
                {new Date(resetResult.reset_timestamp).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h3 className="font-heading font-semibold text-gray-800 mb-3">Detail Penghapusan</h3>
            <div className="space-y-1">
              {resetResult.deletion_log.map((log: string, index: number) => (
                <p key={index} className="text-sm text-gray-600 font-mono">{log}</p>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setResetResult(null)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-2xl p-6 border border-red-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-red-800">Reset Data Sistem</h1>
            <p className="text-red-600 font-body">Hapus semua data transaksional dan master untuk memulai dari awal</p>
            <div className="flex items-center space-x-2 mt-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Super Admin Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-heading font-semibold text-yellow-800 mb-2">⚠️ PERINGATAN PENTING</h3>
            <ul className="text-yellow-700 space-y-1 font-body">
              <li>• <strong>Tindakan ini TIDAK DAPAT DIBATALKAN</strong></li>
              <li>• Semua data penjualan, pembelian, produksi, dan keuangan akan dihapus</li>
              <li>• Data master (produk, pelanggan, supplier) akan ikut terhapus</li>
              <li>• Aplikasi akan kembali ke kondisi awal tanpa data bisnis</li>
              <li>• Akun user dan pengaturan sistem akan tetap terjaga</li>
            </ul>
          </div>
        </div>
      </div>

      {!showPreview ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold text-gray-800 mb-2">Preview Data Reset</h3>
            <p className="text-gray-600 font-body mb-6">
              Lihat data apa saja yang akan dihapus sebelum melanjutkan proses reset
            </p>
            <button
              onClick={loadPreview}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Eye className="w-5 h-5" />}
              <span>{loading ? 'Memuat...' : 'Lihat Preview'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preview Summary */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold text-gray-800">Preview Data Reset</h2>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-display font-bold text-red-600">{totalToDelete.toLocaleString()}</p>
                <p className="text-xs text-gray-500">akan dihapus</p>
              </div>
            </div>

            {preview && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transactional Data */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="font-heading font-semibold text-red-800 mb-3 flex items-center space-x-2">
                    <Receipt className="w-5 h-5" />
                    <span>Data Transaksional</span>
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(preview.transactional_data).map(([key, count]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 font-body">{formatDataLabel(key)}</span>
                        <span className="font-tabular font-semibold text-red-700">{count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Master Data */}
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <h3 className="font-heading font-semibold text-orange-800 mb-3 flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Data Master</span>
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(preview.master_data).map(([key, count]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 font-body">{formatDataLabel(key)}</span>
                        <span className="font-tabular font-semibold text-orange-700">{count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Will be Preserved */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="font-heading font-semibold text-green-800 mb-3 flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Akan Dipertahankan</span>
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(preview.will_be_preserved).map(([key, description]) => (
                      <div key={key}>
                        <p className="text-sm font-medium text-green-700">{formatDataLabel(key)}</p>
                        <p className="text-xs text-green-600 font-body">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowPreview(false)}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Kembali
            </button>
            
            <button
              onClick={() => setShowConfirmation(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Lanjut Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            {confirmationStep === 1 ? (
              <>
                <div className="text-center mb-6">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-bold text-gray-800 mb-2">Konfirmasi Reset Data</h3>
                  <p className="text-gray-600 font-body">
                    Anda akan menghapus <strong className="text-red-600 font-tabular">{totalToDelete.toLocaleString()}</strong> records dari database.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-body text-center">
                    <strong>Tindakan ini tidak dapat dibatalkan!</strong><br />
                    Pastikan Anda sudah melakukan backup jika diperlukan.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ketik "HAPUS SEMUA DATA" untuk melanjutkan:
                  </label>
                  <input
                    type="text"
                    value={userConfirmation}
                    onChange={(e) => setUserConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-body"
                    placeholder="HAPUS SEMUA DATA"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setConfirmationStep(1);
                      setUserConfirmation('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (userConfirmation === 'HAPUS SEMUA DATA') {
                        setConfirmationStep(2);
                        setConfirmationCode('RESET_ALL_DATA_PERMANENT');
                      } else {
                        alert('Konfirmasi tidak sesuai!');
                      }
                    }}
                    disabled={userConfirmation !== 'HAPUS SEMUA DATA'}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lanjutkan
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-bold text-gray-800 mb-2">Konfirmasi Akhir</h3>
                  <p className="text-gray-600 font-body">
                    Klik tombol di bawah untuk menjalankan reset data.
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-orange-800 font-body text-center">
                    <strong>Proses akan dimulai setelah Anda mengklik "RESET SEKARANG"</strong><br />
                    Tunggu hingga proses selesai dan jangan tutup browser.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setConfirmationStep(1)}
                    disabled={resetInProgress}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={executeReset}
                    disabled={resetInProgress}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {resetInProgress ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Menjalankan Reset...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-5 h-5" />
                        <span>RESET SEKARANG</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
