import { useState, useEffect } from 'react';
import RoleGuard from '@/react-app/components/RoleGuard';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import { 
  Settings,
  Database,
  Activity,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Users,
  TrendingUp,
  Globe,
  Bell,
  Shield,
  FileText,
  Monitor,
  Zap,
  Calendar,
  BarChart3,
  Trash2,
  Copy,
  Save,
  X,
  Plus,
  RotateCcw
} from 'lucide-react';
import DataResetManager from '@/react-app/components/DataResetManager';

interface SystemInfo {
  database_size: number;
  total_records: number;
  active_users: number;
  system_uptime: number;
  last_backup: string | null;
  storage_used: number;
  app_version: string;
}

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  category: string;
  description: string;
  data_type: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface LogEntry {
  id: number;
  level: string;
  message: string;
  timestamp: string;
  user_id?: string;
  ip_address?: string;
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingSettings, setEditingSettings] = useState<{[key: string]: string}>({});
  const [showNewSetting, setShowNewSetting] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
    data_type: 'string',
    is_public: false
  });
  const [backupInProgress, setBackupInProgress] = useState(false);

  const settingCategories = [
    { id: 'general', name: 'Umum', icon: Settings },
    { id: 'company', name: 'Perusahaan', icon: Globe },
    { id: 'notification', name: 'Notifikasi', icon: Bell },
    { id: 'security', name: 'Keamanan', icon: Shield },
    { id: 'performance', name: 'Performa', icon: Zap },
    { id: 'maintenance', name: 'Pemeliharaan', icon: Calendar }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [infoRes, settingsRes, logsRes] = await Promise.all([
        fetch('/api/system/info'),
        fetch('/api/system/settings'),
        fetch('/api/system/logs?limit=100')
      ]);

      if (infoRes.ok) setSystemInfo(await infoRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBackupInProgress(true);
      const response = await fetch('/api/system/backup', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        alert(`Backup berhasil dibuat: ${result.filename}`);
        loadData(); // Refresh system info
      }
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup gagal');
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleSystemTest = async () => {
    try {
      const response = await fetch('/api/system/health-check');
      if (response.ok) {
        alert('Sistem berjalan dengan baik!');
      }
    } catch (error) {
      console.error('System test failed:', error);
    }
  };

  const saveSetting = async (settingId: number, key: string) => {
    try {
      const value = editingSettings[key];
      const response = await fetch(`/api/system/settings/${settingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      if (response.ok) {
        await loadData();
        setEditingSettings(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const createSetting = async () => {
    try {
      const response = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting)
      });
      if (response.ok) {
        setNewSetting({
          key: '',
          value: '',
          category: 'general',
          description: '',
          data_type: 'string',
          is_public: false
        });
        setShowNewSetting(false);
        await loadData();
      }
    } catch (error) {
      console.error('Error creating setting:', error);
    }
  };

  const deleteSetting = async (id: number) => {
    if (!confirm('Hapus pengaturan ini?')) return;
    
    try {
      const response = await fetch(`/api/system/settings/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Hapus semua log sistem? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      const response = await fetch('/api/system/logs', { method: 'DELETE' });
      if (response.ok) {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'debug': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} hari, ${remainingHours} jam`;
  };

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Pengaturan Sistem</h1>
              <p className="text-gray-600">Kelola konfigurasi dan pemeliharaan sistem</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSystemTest}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Test Sistem</span>
            </button>
            
            <button
              onClick={handleBackup}
              disabled={backupInProgress}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {backupInProgress ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>{backupInProgress ? 'Backup...' : 'Backup DB'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Ringkasan', icon: Monitor },
              { id: 'settings', name: 'Pengaturan', icon: Settings },
              { id: 'logs', name: 'Log Sistem', icon: FileText },
              { id: 'maintenance', name: 'Pemeliharaan', icon: Calendar },
              { id: 'reset', name: 'Reset Data', icon: RotateCcw }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Info Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Database Size</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {systemInfo ? formatBytes(systemInfo.database_size) : 'N/A'}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {systemInfo?.total_records?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {systemInfo?.active_users || '0'}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Uptime</p>
                    <p className="text-lg font-bold text-gray-900">
                      {systemInfo ? formatUptime(systemInfo.system_uptime) : 'N/A'}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Sistem</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Online</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Server</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Healthy</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">OK</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="text-sm text-gray-900">
                    {systemInfo?.last_backup ? new Date(systemInfo.last_backup).toLocaleDateString('id-ID') : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Add New Setting Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Sistem</h3>
              <button
                onClick={() => setShowNewSetting(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Setting</span>
              </button>
            </div>

            {/* New Setting Form */}
            {showNewSetting && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Tambah Pengaturan Baru</h4>
                  <button
                    onClick={() => setShowNewSetting(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                    <input
                      type="text"
                      value={newSetting.key}
                      onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., app_name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="text"
                      value={newSetting.value}
                      onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Setting value"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newSetting.category}
                      onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {settingCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                    <select
                      value={newSetting.data_type}
                      onChange={(e) => setNewSetting({ ...newSetting, data_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newSetting.description}
                      onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Deskripsi pengaturan"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={newSetting.is_public}
                      onChange={(e) => setNewSetting({ ...newSetting, is_public: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
                      Public (dapat diakses client)
                    </label>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowNewSetting(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={createSetting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* Settings by Category */}
            {settingCategories.map(category => {
              const categorySettings = settings.filter(s => s.category === category.id);
              if (categorySettings.length === 0) return null;

              return (
                <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <category.icon className="w-5 h-5 text-blue-600" />
                      <h4 className="text-lg font-semibold text-gray-900">{category.name}</h4>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {categorySettings.map(setting => (
                        <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium text-gray-900">{setting.key}</h5>
                              {setting.is_public && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  Public
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                            
                            <div className="mt-2">
                              {editingSettings[setting.key] !== undefined ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type={setting.data_type === 'number' ? 'number' : 'text'}
                                    value={editingSettings[setting.key]}
                                    onChange={(e) => setEditingSettings(prev => ({
                                      ...prev,
                                      [setting.key]: e.target.value
                                    }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <button
                                    onClick={() => saveSetting(setting.id, setting.key)}
                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updated = { ...editingSettings };
                                      delete updated[setting.key];
                                      setEditingSettings(updated);
                                    }}
                                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg">
                                    {setting.value}
                                  </span>
                                  <button
                                    onClick={() => setEditingSettings(prev => ({
                                      ...prev,
                                      [setting.key]: setting.value
                                    }))}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => navigator.clipboard?.writeText(setting.value)}
                                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    title="Copy value"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteSetting(setting.id)}
                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Log Sistem</h3>
              <button
                onClick={clearLogs}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Logs</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Tidak ada log tersedia</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getLogLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{log.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                          {log.ip_address && ` • IP: ${log.ip_address}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Maintenance Tools */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tools Pemeliharaan</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => fetch('/api/system/optimize-database', { method: 'POST' })}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Optimize Database</p>
                    <p className="text-sm text-gray-600">Bersihkan dan optimize database</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => fetch('/api/system/clear-cache', { method: 'POST' })}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Clear Cache</p>
                    <p className="text-sm text-gray-600">Hapus cache sistem</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => fetch('/api/products/recalculate-costs', { method: 'POST' })}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Recalculate Product Costs</p>
                    <p className="text-sm text-gray-600">Update harga pokok produk</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Backup Management */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manajemen Backup</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Auto Backup: Aktif</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Backup otomatis setiap hari pada pukul 02:00
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleBackup}
                    disabled={backupInProgress}
                    className="flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Backup Now</span>
                  </button>
                  
                  <button className="flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Restore</span>
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Last backup: {systemInfo?.last_backup ? new Date(systemInfo.last_backup).toLocaleString('id-ID') : 'Never'}</p>
                  <p>Backup size: {systemInfo ? formatBytes(systemInfo.database_size * 1.2) : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reset' && (
          <DataResetManager onResetComplete={() => loadData()} />
        )}
      </div>
    </RoleGuard>
  );
}
