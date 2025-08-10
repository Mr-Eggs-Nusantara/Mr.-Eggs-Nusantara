import { Receipt, DollarSign, Calendar, Hash, User, Phone } from "lucide-react";

interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  unit: string;
  total: number;
}

interface ReceiptData {
  id: number;
  items: ReceiptItem[];
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

interface ReceiptTemplateProps {
  data: ReceiptData;
  onPrint: () => void;
  onWhatsApp: () => void;
  onClose: () => void;
}

export default function ReceiptTemplate({ data, onPrint, onWhatsApp, onClose }: ReceiptTemplateProps) {
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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Tunai';
      case 'transfer': return 'Transfer Bank';
      case 'qris': return 'QRIS';
      case 'edc': return 'EDC/Kartu';
      case 'credit': return 'Kredit';
      default: return method;
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'umum': return 'Retail';
      case 'toko': return 'Toko';
      case 'grosir': return 'Grosir';
      default: return 'Retail';
    }
  };

  const generateWhatsAppMessage = () => {
    let message = `*STRUK PEMBAYARAN* 🧾\n\n`;
    message += `*Mr. Eggs Nusantara*\n`;
    message += `📍 Jl. Nusantara Raya No. 88\n`;
    message += `📞 0812-EGGS-888\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📄 *No. Invoice:* INV-${data.id}\n`;
    message += `📅 *Tanggal:* ${formatDateTime(data.created_at)}\n`;
    message += `👤 *Pelanggan:* ${data.customer_name || 'Customer Umum'}\n`;
    message += `🏷️ *Kategori:* ${getCustomerTypeLabel(data.customer_type)}\n`;
    if (data.customer_phone) {
      message += `📞 *Telepon:* ${data.customer_phone}\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `*DETAIL PEMBELIAN:*\n`;
    
    data.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      message += `   ${item.quantity} ${item.unit} × ${formatRupiah(item.unit_price)}\n`;
      message += `   = ${formatRupiah(item.total)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💰 *Subtotal:* ${formatRupiah(data.subtotal)}\n`;
    if (data.discount > 0) {
      message += `🏷️ *Diskon:* -${formatRupiah(data.discount)}\n`;
    }
    message += `*💵 TOTAL:* ${formatRupiah(data.total)}\n\n`;
    message += `💳 *Pembayaran:* ${getPaymentMethodLabel(data.payment_method)}\n`;
    if (data.bank_account && ['transfer', 'qris', 'edc'].includes(data.payment_method)) {
      message += `🏦 *Rekening:* ${data.bank_account}\n`;
    }
    if (data.payment_method === 'cash' && data.cash_received) {
      message += `💴 *Diterima:* ${formatRupiah(data.cash_received)}\n`;
      if (data.change && data.change > 0) {
        message += `💸 *Kembalian:* ${formatRupiah(data.change)}\n`;
      }
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `✨ *Terima kasih atas kepercayaan Anda!*\n`;
    message += `🙏 Semoga produk kami bermanfaat\n\n`;
    message += `📱 Hubungi kami: 0812-EGGS-888\n`;
    message += `🌐 Follow IG: @mreggsnus`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppShare = () => {
    const message = generateWhatsAppMessage();
    const phone = data.customer_phone?.replace(/[^\d]/g, '') || '';
    let url = `https://wa.me/${phone}?text=${message}`;
    
    // If no customer phone, open WhatsApp with message only
    if (!phone) {
      url = `https://wa.me/?text=${message}`;
    }
    
    window.open(url, '_blank');
    onWhatsApp();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="w-6 h-6" />
              <h2 className="text-lg font-bold">Struk Pembayaran</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div id="receipt-content" className="p-6 max-h-96 overflow-y-auto">
          {/* Store Header */}
          <div className="text-center mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-xl font-bold text-gray-800">MR. EGGS NUSANTARA</h1>
            <p className="text-sm text-gray-600">Jl. Nusantara Raya No. 88</p>
            <p className="text-sm text-gray-600">Telp: 0812-EGGS-888</p>
          </div>

          {/* Transaction Info */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <span>No. Invoice:</span>
              </span>
              <span className="font-medium">INV-{data.id}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Tanggal:</span>
              </span>
              <span className="font-medium">{formatDateTime(data.created_at)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Pelanggan:</span>
              </span>
              <span className="font-medium">{data.customer_name || 'Customer Umum'}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Kategori:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                data.customer_type === 'umum' ? 'bg-blue-100 text-blue-800' :
                data.customer_type === 'toko' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {getCustomerTypeLabel(data.customer_type)}
              </span>
            </div>
            
            {data.customer_phone && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>Telepon:</span>
                </span>
                <span className="font-medium">{data.customer_phone}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Detail Pembelian:</h3>
            <div className="space-y-3">
              {data.items.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{item.product_name}</p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} {item.unit} × {formatRupiah(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 text-sm">{formatRupiah(item.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatRupiah(data.subtotal)}</span>
            </div>
            
            {data.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Diskon:</span>
                <span>-{formatRupiah(data.discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2">
              <span>TOTAL:</span>
              <span>{formatRupiah(data.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span>Pembayaran:</span>
              </span>
              <span className="font-medium">{getPaymentMethodLabel(data.payment_method)}</span>
            </div>
            
            {data.bank_account && ['transfer', 'qris', 'edc'].includes(data.payment_method) && (
              <div className="flex justify-between text-sm">
                <span>Rekening:</span>
                <span className="font-medium">{data.bank_account}</span>
              </div>
            )}
            
            {data.payment_method === 'cash' && data.cash_received && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Diterima:</span>
                  <span className="font-medium">{formatRupiah(data.cash_received)}</span>
                </div>
                
                {data.change && data.change > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(data.change)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Terima kasih atas kepercayaan Anda!</p>
            <p className="text-xs text-gray-500">Hubungi kami: 0812-EGGS-888</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onPrint}
              className="flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Receipt className="w-5 h-5" />
              <span>Cetak Struk</span>
            </button>
            
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              <Phone className="w-5 h-5" />
              <span>Kirim WA</span>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
