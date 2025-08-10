import { useAuth } from "@getmocha/users-service/react";
import { useState, useEffect } from "react";

// Define permission types
export type Permission = 
  // Core permissions
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_employees'
  // Inventory permissions
  | 'manage_suppliers'
  | 'manage_raw_materials'
  | 'manage_products'
  | 'view_inventory'
  // Operations permissions
  | 'manage_purchases'
  | 'manage_production'
  | 'view_operations'
  // Sales permissions
  | 'manage_customers'
  | 'manage_sales'
  | 'manage_pricing'
  | 'view_sales'
  // Financial permissions
  | 'manage_financial'
  | 'view_financial'
  | 'manage_bank_accounts'
  // System permissions
  | 'system_settings'
  | 'view_reports';

// Define role permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'manage_users',
    'manage_employees',
    'manage_suppliers',
    'manage_raw_materials',
    'manage_products',
    'view_inventory',
    'manage_purchases',
    'manage_production',
    'view_operations',
    'manage_customers',
    'manage_sales',
    'manage_pricing',
    'view_sales',
    'manage_financial',
    'view_financial',
    'manage_bank_accounts',
    'system_settings',
    'view_reports'
  ],
  admin: [
    'view_dashboard',
    'manage_employees',
    'manage_suppliers',
    'manage_raw_materials',
    'manage_products',
    'view_inventory',
    'manage_purchases',
    'manage_production',
    'view_operations',
    'manage_customers',
    'manage_sales',
    'manage_pricing',
    'view_sales',
    'manage_financial',
    'view_financial',
    'manage_bank_accounts',
    'view_reports'
  ],
  manager: [
    'view_dashboard',
    'view_inventory',
    'manage_purchases',
    'manage_production',
    'view_operations',
    'manage_customers',
    'manage_sales',
    'view_sales',
    'view_financial',
    'view_reports'
  ],
  staff: [
    'view_dashboard',
    'view_inventory',
    'manage_sales',
    'view_sales',
    'manage_customers'
  ]
};

// Define menu access based on permissions
export const MENU_PERMISSIONS: Record<string, Permission[]> = {
  '/': ['view_dashboard'],
  '/employees': ['manage_employees'],
  '/users': ['manage_users'],
  '/suppliers': ['manage_suppliers', 'view_inventory'],
  '/raw-materials': ['manage_raw_materials', 'view_inventory'],
  '/products': ['manage_products', 'view_inventory'],
  '/purchases': ['manage_purchases', 'view_operations'],
  '/production': ['manage_production', 'view_operations'],
  '/customers': ['manage_customers', 'view_sales'],
  '/sales': ['manage_sales', 'view_sales'],
  '/pricing': ['manage_pricing', 'view_sales'],
  '/financial': ['manage_financial', 'view_financial'],
  '/access-control': ['system_settings', 'manage_users']
};

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  is_active: boolean;
}

export function usePermissions() {
  const { user: mochaUser } = useAuth();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppUser = async () => {
      if (!mochaUser) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          await response.json();
          
          // Check if user exists in app_users table
          const appUsersResponse = await fetch('/api/users');
          if (appUsersResponse.ok) {
            const appUsers = await appUsersResponse.json();
            const foundUser = appUsers.find((u: any) => u.mocha_user_id === mochaUser.id);
            
            if (foundUser && foundUser.is_active) {
              setAppUser({
                id: foundUser.id,
                email: foundUser.email,
                name: foundUser.name,
                role: foundUser.role,
                is_active: foundUser.is_active
              });
            } else {
              setAppUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching app user:', error);
        setAppUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAppUser();
  }, [mochaUser]);

  const hasPermission = (permission: Permission): boolean => {
    if (!appUser || !appUser.is_active) {
      // If authenticated user but not in app_users table, give basic permissions
      if (mochaUser && !appUser) {
        const basicPermissions: Permission[] = ['view_dashboard', 'manage_users', 'system_settings'];
        return basicPermissions.includes(permission);
      }
      return false;
    }
    const rolePermissions = ROLE_PERMISSIONS[appUser.role] || [];
    return rolePermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const canAccessMenu = (menuPath: string): boolean => {
    const requiredPermissions = MENU_PERMISSIONS[menuPath];
    if (!requiredPermissions) return true;
    
    // Allow dashboard access for any authenticated user
    if (menuPath === '/' && mochaUser) return true;
    
    // If user is authenticated but not in app_users table, show basic menus
    if (mochaUser && !appUser) {
      const basicMenus = ['/', '/users', '/access-control'];
      return basicMenus.includes(menuPath);
    }
    
    return hasAnyPermission(requiredPermissions);
  };

  const getUserRole = (): string => {
    return appUser?.role || 'guest';
  };

  const getRoleLabel = (): string => {
    const roleLabels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      manager: 'Manager',
      staff: 'Staff',
      guest: 'Guest'
    };
    
    // If authenticated but not in app_users, show as pending
    if (mochaUser && !appUser) {
      return 'Pending Setup';
    }
    
    return roleLabels[getUserRole() as keyof typeof roleLabels] || 'Unknown';
  };

  const isAdmin = (): boolean => {
    return ['super_admin', 'admin'].includes(appUser?.role || '');
  };

  const isSuperAdmin = (): boolean => {
    return appUser?.role === 'super_admin';
  };

  return {
    appUser,
    loading,
    hasPermission,
    hasAnyPermission,
    canAccessMenu,
    getUserRole,
    getRoleLabel,
    isAdmin,
    isSuperAdmin,
    isAuthenticated: !!mochaUser
  };
}
