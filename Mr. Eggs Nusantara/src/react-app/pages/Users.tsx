import { useState } from "react";
import { useApi, apiPost, apiPut, apiDelete } from "@/react-app/hooks/useApi";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import RoleGuard from "@/react-app/components/RoleGuard";
import { useAuth } from "@getmocha/users-service/react";
import { usePermissions } from "@/react-app/hooks/usePermissions";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Phone, 
  Mail, 
  User,
  Users as UsersIcon,
  Shield,
  ShieldCheck,
  UserPlus,
  Crown,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  RefreshCw
} from "lucide-react";

interface AppUser {
  id?: number;
  mocha_user_id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  phone?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}



const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager', 
  staff: 'Staff'
};

const roleColors = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-300',
  admin: 'bg-red-100 text-red-800 border-red-300',
  manager: 'bg-blue-100 text-blue-800 border-blue-300',
  staff: 'bg-green-100 text-green-800 border-green-300'
};

const roleIcons = {
  super_admin: Crown,
  admin: ShieldCheck,
  manager: Shield,
  staff: User
};

const roleDescriptions = {
  super_admin: 'Akses penuh ke semua fitur sistem termasuk manajemen user',
  admin: 'Akses penuh ke operasional dan keuangan, tidak dapat manage user',
  manager: 'Akses ke operasional, produksi, dan laporan penjualan',
  staff: 'Akses terbatas ke penjualan dan inventori dasar'
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const { isSuperAdmin, appUser } = usePermissions();
  const { data: users, loading, error, refetch } = useApi<AppUser[]>("/users", []);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bulkSelection, setBulkSelection] = useState<number[]>([]);
  const [formData, setFormData] = useState<Partial<AppUser>>({
    mocha_user_id: "",
    email: "",
    name: "",
    role: "staff",
    phone: "",
    is_active: true
  });

  // Filter users based on search, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      mocha_user_id: "",
      email: "",
      name: "",
      role: "staff",
      phone: "",
      is_active: true
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await apiPut(`/users/${editingUser.id}`, formData);
      } else {
        await apiPost("/users", formData);
      }
      
      await refetch();
      resetForm();
    } catch (error: any) {
      console.error("Error saving user:", error);
      alert(error.message || "Terjadi kesalahan saat menyimpan data user");
    }
  };

  const handleEdit = (user: AppUser) => {
    setFormData(user);
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user "${name}"? User ini tidak akan bisa login lagi.`)) {
      try {
        await apiDelete(`/users/${id}`);
        await refetch();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Terjadi kesalahan saat menghapus user");
      }
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    const newStatus = !user.is_active;
    const action = newStatus ? "mengaktifkan" : "menonaktifkan";
    
    if (confirm(`Apakah Anda yakin ingin ${action} user "${user.name}"?`)) {
      try {
        await apiPut(`/users/${user.id}`, { ...user, is_active: newStatus });
        await refetch();
      } catch (error) {
        console.error("Error updating user status:", error);
        alert(`Terjadi kesalahan saat ${action} user`);
      }
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (bulkSelection.length === 0) return;
    
    const actionText = action === 'activate' ? 'mengaktifkan' : 
                     action === 'deactivate' ? 'menonaktifkan' : 'menghapus';
    
    if (!confirm(`Apakah Anda yakin ingin ${actionText} ${bulkSelection.length} user yang dipilih?`)) {
      return;
    }
    
    try {
      for (const userId of bulkSelection) {
        const user = users.find(u => u.id === userId);
        if (!user) continue;
        
        if (action === 'delete') {
          await apiDelete(`/users/${userId}`);
        } else {
          const newStatus = action === 'activate';
          await apiPut(`/users/${userId}`, { ...user, is_active: newStatus });
        }
      }
      
      setBulkSelection([]);
      await refetch();
    } catch (error) {
      console.error(`Error with bulk ${action}:`, error);
      alert(`Terjadi kesalahan saat ${actionText} user`);
    }
  };

  const copyMochaUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    // Simple notification - you could make this more elaborate
    const originalText = `Copied: ${userId}`;
    console.log(originalText);
  };

  const generateMochaUserId = () => {
    // Generate a placeholder Mocha User ID format
    const prefix = "user_";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}${timestamp}_${random}`;
  };

  if (!isSuperAdmin()) {
    return (
      <RoleGuard requiredRole="super_admin">
        <div>Unauthorized</div>
      </RoleGuard>
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
          Error loading users: {error}
          <button 
            onClick={() => refetch()} 
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.is_active).length;
  const totalUsers = users.length;
  const adminUsers = users.filter(u => ['super_admin', 'admin'].includes(u.role)).length;
  const recentUsers = users.filter(u => {
    if (!u.created_at) return false;
    const created = new Date(u.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;

  const roleStats = Object.keys(roleLabels).map(role => ({
    role: role as keyof typeof roleLabels,
    count: users.filter(u => u.role === role).length
  }));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Manajemen User
              <span className="ml-3 text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                Super Admin Only
              </span>
            </h1>
            <p className="text-gray-600">Kelola akun pengguna dan hak akses aplikasi</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => refetch()}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Admin Info */}
      {currentUser && appUser && (
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl p-6 border border-purple-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Logged in as:</p>
                <p className="text-lg font-bold text-purple-800">{appUser.name}</p>
                <p className="text-sm text-purple-700">{appUser.email} • {roleLabels[appUser.role]}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-600">Status</p>
              <p className="text-sm font-medium text-purple-800">Active Session</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total User</p>
              <p className="text-2xl font-bold text-blue-800">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">User Aktif</p>
              <p className="text-2xl font-bold text-green-800">{activeUsers}</p>
              <p className="text-xs text-green-600">
                {totalUsers - activeUsers} tidak aktif
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Admin</p>
              <p className="text-2xl font-bold text-purple-800">{adminUsers}</p>
              <p className="text-xs text-purple-600">
                Super Admin & Admin
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">User Baru</p>
              <p className="text-sm text-orange-600">(7 hari terakhir)</p>
              <p className="text-2xl font-bold text-orange-800">{recentUsers}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Role</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roleStats.map(({ role, count }) => {
            const RoleIcon = roleIcons[role];
            return (
              <div key={role} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-center mb-2">
                  <RoleIcon className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-lg font-bold text-gray-800">{count}</p>
                <p className="text-sm text-gray-600">{roleLabels[role]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari user berdasarkan nama, email, atau telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
              />
            </div>
          </div>
          
          {/* Role Filter */}
          <div className="min-w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
            >
              <option value="all">Semua Role</option>
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="min-w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {bulkSelection.length > 0 && (
          <div className="flex items-center justify-between mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <span className="text-purple-800 font-medium">
              {bulkSelection.length} user dipilih
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Aktifkan
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              >
                Nonaktifkan
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Hapus
              </button>
              <button
                onClick={() => setBulkSelection([])}
                className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={bulkSelection.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelection(filteredUsers.map(u => u.id!));
                      } else {
                        setBulkSelection([]);
                      }
                    }}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Kontak
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Account Info
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                        ? "Tidak ada user yang sesuai dengan filter" 
                        : "Belum ada data user"}
                    </p>
                    <p className="text-sm">
                      {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                        ? "Coba ubah kata kunci atau filter pencarian" 
                        : "Tambahkan user pertama untuk memulai"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = roleIcons[user.role];
                  const isSelected = bulkSelection.includes(user.id!);
                  
                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-purple-50/50 transition-colors ${
                        isSelected ? 'bg-purple-50 border border-purple-200' : ''
                      } ${!user.is_active ? 'opacity-75' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelection([...bulkSelection, user.id!]);
                            } else {
                              setBulkSelection(bulkSelection.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center ${
                            user.is_active 
                              ? 'from-purple-400 to-indigo-500' 
                              : 'from-gray-400 to-gray-500'
                          }`}>
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center space-x-2">
                              <span>{user.name}</span>
                              {user.id === appUser?.id && (
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleLabels[user.role]}
                          </span>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active 
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {user.is_active ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Aktif
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Tidak Aktif
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate max-w-48">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-gray-500">Mocha ID:</span>
                            <div className="flex items-center space-x-1">
                              <span className="font-mono text-gray-700 truncate max-w-24">
                                {user.mocha_user_id}
                              </span>
                              <button
                                onClick={() => copyMochaUserId(user.mocha_user_id)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy Mocha User ID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Bergabung:</span>
                            <div className="text-gray-700">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Login Terakhir:</span>
                            <div className="text-gray-700">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active
                                ? 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-100'
                                : 'text-gray-600 hover:text-green-600 hover:bg-green-100'
                            }`}
                            title={user.is_active ? "Nonaktifkan user" : "Aktifkan user"}
                          >
                            {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          
                          {user.id !== appUser?.id && (
                            <button
                              onClick={() => handleDelete(user.id!, user.name!)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Hapus user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mocha User ID *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={formData.mocha_user_id || ""}
                      onChange={(e) => setFormData({ ...formData, mocha_user_id: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                      placeholder="user_12345678_abcd"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mocha_user_id: generateMochaUserId() })}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Generate sample ID"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ID unik dari sistem Mocha untuk user ini
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="user@company.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="08123456789"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role || "staff"}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                  ))}
                </select>
                {formData.role && (
                  <p className="text-xs text-gray-600 mt-1">
                    {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  User aktif (dapat login ke aplikasi)
                </label>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">Penting:</p>
                    <ul className="text-blue-700 space-y-1 list-disc list-inside">
                      <li>User harus memiliki akun Google yang terdaftar di sistem Mocha</li>
                      <li>Mocha User ID harus sesuai dengan ID yang diberikan saat OAuth login</li>
                      <li>Hanya Super Admin yang dapat mengelola user dan mengubah role</li>
                      <li>User yang tidak aktif tidak akan bisa login ke aplikasi</li>
                    </ul>
                  </div>
                </div>
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-colors"
                >
                  {editingUser ? "Update User" : "Simpan User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
