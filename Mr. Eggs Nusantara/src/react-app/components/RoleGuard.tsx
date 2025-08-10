import React from 'react';
import { usePermissions, Permission } from '@/react-app/hooks/usePermissions';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  permissions?: Permission[];
  requiredRole?: 'super_admin' | 'admin' | 'manager' | 'staff';
  fallback?: React.ReactNode;
  showError?: boolean;
}

export default function RoleGuard({ 
  children, 
  permissions = [], 
  requiredRole,
  fallback,
  showError = true 
}: RoleGuardProps) {
  const { 
    loading, 
    hasAnyPermission, 
    getUserRole, 
    getRoleLabel,
    isAuthenticated 
  } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Memeriksa akses...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    
    if (!showError) return null;
    
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="text-center p-8">
          <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Akses Ditolak</h3>
          <p className="text-gray-600">Anda perlu login untuk mengakses halaman ini</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = {
      staff: 1,
      manager: 2,
      admin: 3,
      super_admin: 4
    };

    const userRoleLevel = roleHierarchy[getUserRole() as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      if (fallback) return <>{fallback}</>;
      
      if (!showError) return null;

      return (
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center p-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Akses Terbatas</h3>
            <p className="text-red-600 mb-2">
              Halaman ini memerlukan role minimal: <span className="font-semibold">{requiredRole}</span>
            </p>
            <p className="text-sm text-gray-600">
              Role Anda saat ini: <span className="font-medium">{getRoleLabel()}</span>
            </p>
          </div>
        </div>
      );
    }
  }

  // Check permission-based access
  if (permissions.length > 0 && !hasAnyPermission(permissions)) {
    if (fallback) return <>{fallback}</>;
    
    if (!showError) return null;

    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-semibold text-amber-700 mb-2">Akses Tidak Diizinkan</h3>
          <p className="text-amber-600 mb-2">
            Anda tidak memiliki izin untuk mengakses fitur ini
          </p>
          <p className="text-sm text-gray-600">
            Role Anda: <span className="font-medium">{getRoleLabel()}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component version
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  permissions?: Permission[],
  requiredRole?: 'super_admin' | 'admin' | 'manager' | 'staff'
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleGuard permissions={permissions} requiredRole={requiredRole}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

// Utility components for common role checks
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="admin" fallback={fallback} showError={false}>
      {children}
    </RoleGuard>
  );
}

export function SuperAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="super_admin" fallback={fallback} showError={false}>
      {children}
    </RoleGuard>
  );
}

export function ManagerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="manager" fallback={fallback} showError={false}>
      {children}
    </RoleGuard>
  );
}
