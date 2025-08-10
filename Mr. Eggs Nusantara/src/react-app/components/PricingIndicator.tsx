import { Tag, TrendingDown, AlertTriangle } from "lucide-react";

interface PricingIndicatorProps {
  originalPrice: number;
  currentPrice: number;
  customerType: string;
  isSpecialPrice?: boolean;
}

export default function PricingIndicator({ 
  originalPrice, 
  currentPrice, 
  customerType, 
  isSpecialPrice = false 
}: PricingIndicatorProps) {
  const hasDiscount = currentPrice < originalPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'umum': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'toko': return 'bg-green-100 text-green-800 border-green-200';
      case 'grosir': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'umum': return 'Umum';
      case 'toko': return 'Toko';
      case 'grosir': return 'Grosir';
      default: return 'Umum';
    }
  };

  if (!isSpecialPrice && currentPrice === originalPrice) {
    return (
      <div className="inline-flex items-center space-x-1">
        <Tag className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-500">Harga standar</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1">
      {/* Current Price */}
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-gray-800">
          {formatRupiah(currentPrice)}
        </span>
        
        {hasDiscount && (
          <div className="flex items-center space-x-1">
            <TrendingDown className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium text-green-600">
              -{discountPercentage}%
            </span>
          </div>
        )}
      </div>

      {/* Original Price (if different) */}
      {hasDiscount && (
        <div className="text-xs text-gray-500 line-through">
          {formatRupiah(originalPrice)}
        </div>
      )}

      {/* Customer Type Indicator */}
      {isSpecialPrice && (
        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCustomerTypeColor(customerType)}`}>
          <Tag className="w-3 h-3 mr-1" />
          Harga {getCustomerTypeLabel(customerType)}
        </div>
      )}

      {/* Special Price Alert */}
      {isSpecialPrice && hasDiscount && (
        <div className="flex items-center space-x-1 text-xs text-orange-600">
          <AlertTriangle className="w-3 h-3" />
          <span>Harga khusus diterapkan</span>
        </div>
      )}
    </div>
  );
}
