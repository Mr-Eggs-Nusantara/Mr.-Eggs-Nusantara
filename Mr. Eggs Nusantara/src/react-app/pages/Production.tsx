import { useState } from "react";
import { useApi, apiPost } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import ProductionDetail from "./ProductionDetail";
import { 
  Plus, 
  Search, 
  Hash, 
  Calendar, 
  DollarSign,
  Package,
  Egg,
  Factory,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Beaker
} from "lucide-react";
import { RawMaterial, Product } from "@/shared/types";

interface ProductionBatch {
  id: number;
  batch_number: string;
  production_date: string;
  status: string;
  total_cost: number;
  notes?: string;
  created_at: string;
  output_count: number;
  total_output_quantity: number;
}

interface ProductionInput {
  raw_material_id: number;
  quantity_used: number;
}

interface ProductionOutput {
  product_id: number;
  quantity_produced: number;
}

export default function Production() {
  const { data: batches, loading, error, refetch } = useApi<ProductionBatch[]>("/production", []);
  const { data: rawMaterials } = useApi<RawMaterial[]>("/raw-materials", []);
  const { data: products } = useApi<Product[]>("/products", []);
  
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputs, setInputs] = useState<ProductionInput[]>([]);
  const [outputs, setOutputs] = useState<ProductionOutput[]>([]);
  const [batchNumber, setBatchNumber] = useState("");
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredBatches = batches.filter(batch =>
    batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addInput = () => {
    setInputs([...inputs, { raw_material_id: 0, quantity_used: 0 }]);
  };

  const updateInput = (index: number, field: keyof ProductionInput, value: number) => {
    const updated = [...inputs];
    updated[index] = { ...updated[index], [field]: value };
    setInputs(updated);
  };

  const removeInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const addOutput = () => {
    setOutputs([...outputs, { product_id: 0, quantity_produced: 0 }]);
  };

  const updateOutput = (index: number, field: keyof ProductionOutput, value: number) => {
    const updated = [...outputs];
    updated[index] = { ...updated[index], [field]: value };
    setOutputs(updated);
  };

  const removeOutput = (index: number) => {
    setOutputs(outputs.filter((_, i) => i !== index));
  };

  const generateBatchNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    setBatchNumber(`BATCH-${dateStr}-${timeStr}`);
  };

  const resetForm = () => {
    setBatchNumber("");
    setProductionDate(new Date().toISOString().split('T')[0]);
    setInputs([]);
    setOutputs([]);
    setNotes("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputs.length === 0) {
      alert("Minimal harus ada 1 input bahan baku");
      return;
    }
    
    if (outputs.length === 0) {
      alert("Minimal harus ada 1 output produk");
      return;
    }

    // Validate inputs
    const validInputs = inputs.filter(input => input.raw_material_id > 0 && input.quantity_used > 0);
    if (validInputs.length === 0) {
      alert("Input bahan baku tidak valid");
      return;
    }

    // Validate outputs
    const validOutputs = outputs.filter(output => output.product_id > 0 && output.quantity_produced > 0);
    if (validOutputs.length === 0) {
      alert("Output produk tidak valid");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const batchData = {
        batch_number: batchNumber,
        production_date: productionDate,
        inputs: validInputs,
        outputs: validOutputs,
        notes: notes
      };
      
      await apiPost("/production", batchData);
      await refetch();
      resetForm();
      alert("Batch produksi berhasil dibuat!");
    } catch (error) {
      console.error("Error creating production batch:", error);
      alert("Terjadi kesalahan saat membuat batch produksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = (batchId: number) => {
    setSelectedBatchId(batchId);
    setShowDetail(true);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  if (showDetail && selectedBatchId) {
    return (
      <ProductionDetail 
        batchId={selectedBatchId} 
        onBack={() => {
          setShowDetail(false);
          setSelectedBatchId(null);
        }}
      />
    );
  }

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
          Error loading production data: {error}
        </div>
      </div>
    );
  }

  const totalBatches = batches.length;
  const completedBatches = batches.filter(b => b.status === 'completed').length;
  const totalProduction = batches.reduce((sum, b) => sum + (b.total_output_quantity || 0), 0);
  const totalCost = batches.reduce((sum, b) => sum + (b.total_cost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Produksi</h1>
            <p className="text-gray-600">Kelola batch produksi telur kemasan</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              generateBatchNumber();
            }}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Batch Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Batch</p>
              <p className="text-2xl font-bold text-blue-800">{totalBatches}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Batch Selesai</p>
              <p className="text-2xl font-bold text-green-800">{completedBatches}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Total Produksi</p>
              <p className="text-2xl font-bold text-purple-800">{totalProduction.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Total Biaya</p>
              <p className="text-xl font-bold text-orange-800">{formatRupiah(totalCost)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-lg mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari batch berdasarkan nomor atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
          />
        </div>
      </div>

      {/* Production Batches Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tanggal Produksi
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Output
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Biaya
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Factory className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Belum ada batch produksi</p>
                    <p className="text-sm">Buat batch produksi pertama Anda untuk memulai</p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const statusInfo = getStatusInfo(batch.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={batch.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                            <Beaker className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{batch.batch_number}</div>
                            <div className="text-sm text-gray-600">
                              ID: #{batch.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(batch.production_date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Dibuat: {formatDateTime(batch.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-gray-800">
                            {(batch.total_output_quantity || 0).toLocaleString()} unit
                          </div>
                          <div className="text-sm text-gray-600">
                            {batch.output_count} produk berbeda
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-semibold text-gray-800">
                          {formatRupiah(batch.total_cost || 0)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {batch.total_output_quantity > 0 
                            ? `${formatRupiah((batch.total_cost || 0) / batch.total_output_quantity)}/unit`
                            : "Rp 0/unit"
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetail(batch.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Lihat detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Buat Batch Produksi Baru</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Batch Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Batch *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Nomor batch unik"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Produksi *
                  </label>
                  <input
                    type="date"
                    required
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Inputs Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Package className="w-5 h-5 text-red-500" />
                    <span>Bahan Baku Input</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addInput}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Input</span>
                  </button>
                </div>

                {inputs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-red-50 rounded-lg border border-red-200">
                    <Package className="w-8 h-8 mx-auto mb-2 text-red-300" />
                    <p>Belum ada bahan baku input</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inputs.map((input, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex-1">
                          <select
                            value={input.raw_material_id}
                            onChange={(e) => updateInput(index, 'raw_material_id', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            required
                          >
                            <option value={0}>Pilih bahan baku</option>
                            {rawMaterials.map(material => (
                              <option key={material.id} value={material.id}>
                                {material.name} (Stok: {material.stock_quantity} {material.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={input.quantity_used}
                            onChange={(e) => updateInput(index, 'quantity_used', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Jumlah"
                            required
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeInput(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Hash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outputs Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Egg className="w-5 h-5 text-green-500" />
                    <span>Produk Jadi Output</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addOutput}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Output</span>
                  </button>
                </div>

                {outputs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-green-50 rounded-lg border border-green-200">
                    <Egg className="w-8 h-8 mx-auto mb-2 text-green-300" />
                    <p>Belum ada produk output</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outputs.map((output, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex-1">
                          <select
                            value={output.product_id}
                            onChange={(e) => updateOutput(index, 'product_id', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                          >
                            <option value={0}>Pilih produk</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={output.quantity_produced}
                            onChange={(e) => updateOutput(index, 'quantity_produced', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Jumlah"
                            required
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeOutput(index)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <Hash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Catatan tambahan untuk batch ini..."
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
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Buat Batch</span>
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
