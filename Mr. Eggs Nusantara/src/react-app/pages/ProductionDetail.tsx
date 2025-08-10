import { useApi } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  ArrowLeft,
  Calendar,
  Hash,
  Package,
  Egg,
  DollarSign,
  TrendingUp,
  Factory,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface ProductionBatchDetail {
  id: number;
  batch_number: string;
  production_date: string;
  status: string;
  total_cost: number;
  notes?: string;
  created_at: string;
  inputs: {
    id: number;
    raw_material_id: number;
    raw_material_name: string;
    raw_material_unit: string;
    quantity_used: number;
    unit_cost: number;
    total_cost: number;
  }[];
  outputs: {
    id: number;
    product_id: number;
    product_name: string;
    product_unit: string;
    quantity_produced: number;
    hpp_per_unit: number;
    total_hpp: number;
  }[];
}

interface ProductionDetailProps {
  batchId: number;
  onBack: () => void;
}

export default function ProductionDetail({ batchId, onBack }: ProductionDetailProps) {
  const { data: batchDetail, loading, error } = useApi<ProductionBatchDetail>(`/production/${batchId}`, {} as ProductionBatchDetail);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'in_progress':
        return { label: 'Berlangsung', color: 'bg-blue-100 text-blue-800', icon: Clock };
      case 'planned':
        return { label: 'Direncanakan', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
      default:
        return { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !batchDetail.id) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading batch detail: {error}
        </div>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(batchDetail.status);
  const StatusIcon = statusInfo.icon;
  const totalInputCost = batchDetail.inputs.reduce((sum, input) => sum + input.total_cost, 0);
  const totalOutputValue = batchDetail.outputs.reduce((sum, output) => sum + output.total_hpp, 0);
  const totalOutputQuantity = batchDetail.outputs.reduce((sum, output) => sum + output.quantity_produced, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Batch</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Detail Batch Produksi</h1>
            <p className="text-gray-600">Informasi lengkap batch produksi {batchDetail.batch_number}</p>
          </div>
          
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Batch Info */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Nomor Batch</p>
              <p className="text-lg font-bold text-gray-800">{batchDetail.batch_number}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tanggal Produksi</p>
              <p className="text-lg font-bold text-gray-800">
                {new Date(batchDetail.production_date).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Biaya</p>
              <p className="text-lg font-bold text-gray-800">{formatRupiah(batchDetail.total_cost)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dibuat</p>
              <p className="text-lg font-bold text-gray-800">
                {formatDateTime(batchDetail.created_at)}
              </p>
            </div>
          </div>
        </div>
        
        {batchDetail.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-1">Catatan:</p>
            <p className="text-gray-800">{batchDetail.notes}</p>
          </div>
        )}
      </div>

      {/* Production Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Inputs */}
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Bahan Baku Input</span>
          </h3>
          
          <div className="space-y-3">
            {batchDetail.inputs.map((input) => (
              <div key={input.id} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{input.raw_material_name}</p>
                    <p className="text-sm text-gray-600">
                      {input.quantity_used.toLocaleString()} {input.raw_material_unit} × {formatRupiah(input.unit_cost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-700">{formatRupiah(input.total_cost)}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-red-100 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-800">Total Biaya Input:</span>
                <span className="text-xl font-bold text-red-800">{formatRupiah(totalInputCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Outputs */}
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
            <Egg className="w-5 h-5" />
            <span>Produk Jadi Output</span>
          </h3>
          
          <div className="space-y-3">
            {batchDetail.outputs.map((output) => (
              <div key={output.id} className="bg-white rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">{output.product_name}</p>
                    <p className="font-bold text-green-700">{formatRupiah(output.total_hpp)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p>Jumlah: <span className="font-medium">{output.quantity_produced.toLocaleString()} {output.product_unit}</span></p>
                    </div>
                    <div>
                      <p>HPP/Unit: <span className="font-medium text-green-700">{formatRupiah(output.hpp_per_unit)}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-800">Total Output:</span>
                <span className="font-bold text-green-800">{totalOutputQuantity.toLocaleString()} unit</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-800">Total Nilai HPP:</span>
                <span className="text-xl font-bold text-green-800">{formatRupiah(totalOutputValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Analisis Produksi</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">HPP Rata-rata per Unit</p>
            <p className="text-2xl font-bold text-blue-800">
              {totalOutputQuantity > 0 ? formatRupiah(totalInputCost / totalOutputQuantity) : formatRupiah(0)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">Efisiensi Biaya</p>
            <p className="text-2xl font-bold text-blue-800">
              {totalInputCost > 0 ? ((totalOutputValue / totalInputCost) * 100).toFixed(0) : 0}%
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">Selisih Nilai</p>
            <p className={`text-2xl font-bold ${
              totalOutputValue >= totalInputCost ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatRupiah(totalOutputValue - totalInputCost)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">Margin Kotor</p>
            <p className={`text-2xl font-bold ${
              totalOutputValue >= totalInputCost ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalOutputValue > 0 ? (((totalOutputValue - totalInputCost) / totalOutputValue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
