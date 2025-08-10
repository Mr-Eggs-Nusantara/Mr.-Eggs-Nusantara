import { useState } from "react";
import { usePermissions, ROLE_PERMISSIONS, Permission } from "@/react-app/hooks/usePermissions";
import RoleGuard from "@/react-app/components/RoleGuard";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  Shield, 
  Users, 
  Crown,
  ShieldCheck,
  Settings,
  Eye,
  Lock,
  CheckCircle,
  XCircle,
  User,
  Building,
  Briefcase,
  Package,
  ShoppingCart,
  Factory,
  Receipt,
  DollarSign,
  CreditCard,
  FileText
} from "lucide-react";

const permissionLabels: Record<Permission, string> = {
  'view_dashboard': 'Lihat Dashboard',
  'manage_users': 'Kelola User',
  'manage_employees': 'Kelola Karyawan',
  'manage_suppliers': 'Kelola Supplier',
  'manage_raw_materials': 'Kelola Bahan Baku',
  'manage_products': 'Kelola Produk',
  'view_inventory': 'Lihat Inventori',
  'manage_purchases': 'Kelola Pembelian',
  'manage_production': 'Kelola Produksi',
  'view_operations': 'Lihat Operasional',
  'manage_customers': 'Kelola Pelanggan',
  'manage_sales': 'Kelola Penjualan',
  'manage_pricing': 'Kelola Harga',
  'view_sales': 'Lihat Penjualan',
  'manage_financial': 'Kelola Keuangan',
  'view_financial': 'Lihat Keuangan',
  'manage_bank_accounts': 'Kelola Rekening Bank',
  'system_settings': 'Pengaturan Sistem',
  'view_reports': 'Lihat Laporan'
};

const permissionCategories = {
  'Core': ['view_dashboard', 'manage_users', 'manage_employees'],
  'Inventori': ['manage_suppliers', 'manage_raw_materials', 'manage_products', 'view_inventory'],
  'Operasional': ['manage_purchases', 'manage_production', 'view_operations'],
  'Penjualan': ['manage_customers', 'manage_sales', 'manage_pricing', 'view_sales'],
  'Keuangan': ['manage_financial', 'view_financial', 'manage_bank_accounts'],
  'Sistem': ['system_settings', 'view_reports']
};

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

export default function AccessControl() {
  const { appUser, loading, getRoleLabel } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_PERMISSIONS>('staff');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getPermissionIcon = (permission: Permission) => {
    const iconMap: Record<string, any> = {
      'view_dashboard': Eye,
      'manage_users': Users,
      'manage_employees': Briefcase,
      'manage_suppliers': Building,
      'manage_raw_materials': Package,
      'manage_products': Package,
      'view_inventory': Eye,
      'manage_purchases': ShoppingCart,
      'manage_production': Factory,
      'view_operations': Eye,
      'manage_customers': Users,
      'manage_sales': Receipt,
      'manage_pricing': DollarSign,
      'view_sales': Eye,
      'manage_financial': DollarSign,
      'view_financial': Eye,
      'manage_bank_accounts': CreditCard,
      'system_settings': Settings,
      'view_reports': FileText
    };
    return iconMap[permission] || Lock;
  };

  const currentUserPermissions = ROLE_PERMISSIONS[appUser?.role || 'staff'] || [];

  return (
    <RoleGuard permissions={['system_settings', 'manage_users']}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Kontrol Akses & Permissions</h1>
              <p className="text-gray-600">Kelola hak akses dan izin berdasarkan role user</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl px-4 py-3 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium">Role Anda</p>
                <p className="text-lg font-bold text-orange-800">{getRoleLabel()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span>Role Overview</span>
              </h3>
              
              <div className="space-y-3">
                {(Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>).map((role) => {
                  const RoleIcon = roleIcons[role as keyof typeof roleIcons];
                  const permissions = ROLE_PERMISSIONS[role];
                  const isSelected = selectedRole === role;
                  
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <RoleIcon className={`w-5 h-5 ${isSelected ? 'text-orange-600' : 'text-gray-500'}`} />
                          <span className={`font-semibold ${isSelected ? 'text-orange-800' : 'text-gray-800'}`}>
                            {roleLabels[role as keyof typeof roleLabels]}
                          </span>
                        </div>
                        {appUser?.role === role && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isSelected ? 'text-orange-600' : 'text-gray-600'}`}>
                        {permissions.length} permissions
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current User Info */}
            {appUser && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Info User Saat Ini</span>
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-600">Nama:</span>
                    <span className="text-sm font-medium text-blue-800">{appUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-600">Email:</span>
                    <span className="text-sm font-medium text-blue-800">{appUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-600">Role:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${roleColors[appUser.role as keyof typeof roleColors]}`}>
                      {roleLabels[appUser.role as keyof typeof roleLabels]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-600">Total Permissions:</span>
                    <span className="text-sm font-bold text-blue-800">{currentUserPermissions.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Permission Matrix */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-purple-500" />
                  <span>Permissions untuk: {roleLabels[selectedRole as keyof typeof roleLabels]}</span>
                </h3>
                
                <div className={`px-3 py-2 rounded-lg border-2 ${roleColors[selectedRole as keyof typeof roleColors]}`}>
                  <span className="font-semibold">{ROLE_PERMISSIONS[selectedRole].length} Permissions</span>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(permissionCategories).map(([category, permissions]) => {
                  const categoryPermissions = permissions as Permission[];
                  const rolePermissions = ROLE_PERMISSIONS[selectedRole] || [];
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                          <span>{category}</span>
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                            {categoryPermissions.filter(p => rolePermissions.includes(p)).length} / {categoryPermissions.length}
                          </span>
                        </h4>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryPermissions.map((permission) => {
                            const hasThisPermission = rolePermissions.includes(permission);
                            const canUserAccess = currentUserPermissions.includes(permission);
                            const PermissionIcon = getPermissionIcon(permission);
                            
                            return (
                              <div
                                key={permission}
                                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                  hasThisPermission 
                                    ? 'border-green-200 bg-green-50' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <PermissionIcon className={`w-4 h-4 ${
                                    hasThisPermission ? 'text-green-600' : 'text-gray-400'
                                  }`} />
                                  <div>
                                    <p className={`text-sm font-medium ${
                                      hasThisPermission ? 'text-green-800' : 'text-gray-600'
                                    }`}>
                                      {permissionLabels[permission]}
                                    </p>
                                    <p className="text-xs text-gray-500">{permission}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {canUserAccess && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                      You have this
                                    </span>
                                  )}
                                  {hasThisPermission ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Role Comparison */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Perbandingan Role</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {(Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>).map((role) => (
                    <div key={role} className={`text-center p-3 rounded-lg ${
                      role === selectedRole ? 'bg-blue-100 border border-blue-300' : 'bg-white'
                    }`}>
                      <p className="font-medium text-gray-800">{roleLabels[role as keyof typeof roleLabels]}</p>
                      <p className={`text-lg font-bold ${
                        role === selectedRole ? 'text-blue-800' : 'text-gray-600'
                      }`}>
                        {ROLE_PERMISSIONS[role].length}
                      </p>
                      <p className="text-xs text-gray-500">permissions</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
