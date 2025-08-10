import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { usePermissions } from "@/react-app/hooks/usePermissions";
import UserSetupBanner from "@/react-app/components/UserSetupBanner";
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  Factory, 
  Receipt, 
  TrendingUp,
  UserCheck,
  Egg,
  Tag,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  Briefcase,
  Shield,
  LogOut,
  Cog
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, category: "main" },
  { name: "Karyawan", href: "/employees", icon: Briefcase, category: "main" },
  { name: "Users", href: "/users", icon: Shield, category: "main" },
  { name: "Kontrol Akses", href: "/access-control", icon: Settings, category: "main" },
  { name: "Pengaturan Sistem", href: "/system-settings", icon: Cog, category: "main" },
  { name: "Supplier", href: "/suppliers", icon: Users, category: "inventory" },
  { name: "Bahan Baku", href: "/raw-materials", icon: Package, category: "inventory" },
  { name: "Produk", href: "/products", icon: Egg, category: "inventory" },
  { name: "Pembelian", href: "/purchases", icon: ShoppingCart, category: "operations" },
  { name: "Produksi", href: "/production", icon: Factory, category: "operations" },
  { name: "Pelanggan", href: "/customers", icon: UserCheck, category: "sales" },
  { name: "Penjualan", href: "/sales", icon: Receipt, category: "sales" },
  { name: "Harga", href: "/pricing", icon: Tag, category: "sales" },
  { name: "Keuangan", href: "/financial", icon: TrendingUp, category: "finance" },
];

const categories = [
  { id: "main", name: "Utama", color: "text-orange-600" },
  { id: "inventory", name: "Inventori", color: "text-blue-600" },
  { id: "operations", name: "Operasional", color: "text-green-600" },
  { id: "sales", name: "Penjualan", color: "text-purple-600" },
  { id: "finance", name: "Keuangan", color: "text-red-600" },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { canAccessMenu, getRoleLabel, appUser } = usePermissions();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter(item => canAccessMenu(item.href));
  
  const groupedNavigation = categories.map(category => ({
    ...category,
    items: filteredNavigation.filter(item => item.category === category.id)
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <UserSetupBanner />
      <div className="flex">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={toggleMobileMenu}
          />
        )}

        {/* Sidebar */}
        <div className={`${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } h-screen bg-white/90 backdrop-blur-sm border-r border-orange-200 shadow-xl transition-all duration-300 ease-in-out relative z-50 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative flex flex-col`}>
          {/* Header */}
          <div className="flex-shrink-0 p-3 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
                <img 
                  src="https://mocha-cdn.com/01989249-2d23-7a9d-b9e9-11770605819c/Logo-1.png" 
                  alt="Mr. Eggs Nusantara Logo" 
                  className={`${isSidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg shadow-lg object-contain bg-white`}
                />
                {!isSidebarCollapsed && (
                  <div>
                    <h1 className="text-lg font-bold text-gray-800">Mr. Eggs</h1>
                    <p className="text-xs text-gray-600">Nusantara</p>
                  </div>
                )}
              </div>
              
              {/* Desktop Collapse Button */}
              <button
                onClick={toggleSidebar}
                className="hidden md:flex p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-all duration-200"
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              
              {/* Mobile Close Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Navigation - Scrollable Area */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent hover:scrollbar-thumb-orange-300">
            <div className="space-y-3">
              {groupedNavigation.map((category) => (
                <div key={category.id}>
                  {/* Category Header */}
                  {!isSidebarCollapsed && (
                    <div className="px-2 mb-2 sticky top-0 bg-white/90 backdrop-blur-sm py-1 -mx-2 z-10">
                      <h3 className={`text-xs font-semibold uppercase tracking-wider ${category.color}`}>
                        {category.name}
                      </h3>
                      <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mt-1" />
                    </div>
                  )}
                  
                  {/* Navigation Items */}
                  <ul className="space-y-1">
                    {category.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center ${
                              isSidebarCollapsed ? 'justify-center px-2' : 'space-x-2 px-3'
                            } py-2.5 rounded-lg transition-all duration-200 group relative ${
                              isActive
                                ? "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md"
                                : "text-gray-700 hover:bg-orange-100/70 hover:text-orange-800"
                            }`}
                            title={isSidebarCollapsed ? item.name : ''}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${
                              isActive 
                                ? "text-white" 
                                : "text-gray-500 group-hover:text-orange-600"
                            } ${isSidebarCollapsed ? 'mx-auto' : ''}`} />
                            
                            {!isSidebarCollapsed && (
                              <span className="font-medium flex-1 text-left truncate text-sm">{item.name}</span>
                            )}
                            
                            {/* Active Indicator */}
                            {isActive && !isSidebarCollapsed && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
                            )}
                            
                            {/* Tooltip for collapsed state */}
                            {isSidebarCollapsed && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                {item.name}
                                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-gray-900 rotate-45"></div>
                              </div>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="flex-shrink-0 px-2 py-2 border-t border-orange-200 bg-white/50 backdrop-blur-sm">
            {!isSidebarCollapsed ? (
              <div className="space-y-2">
                {/* User Info */}
                <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {appUser?.name || user?.google_user_data?.name || user?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {getRoleLabel()} • {user?.email || 'Administrator'}
                    </p>
                    {user && !appUser && (
                      <p className="text-xs text-orange-600 font-medium">
                        Setup Required
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-1">
                  <Link
                    to="/user-settings"
                    className="flex items-center justify-center space-x-1 p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100/70 rounded-md transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    <span className="text-xs">Setting</span>
                  </Link>
                  <button 
                    onClick={() => logout()}
                    className="flex items-center justify-center space-x-1 p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-100/70 rounded-md transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span className="text-xs">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <Link
                  to="/user-settings"
                  className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-md transition-colors"
                  title="Pengaturan"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => logout()}
                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-screen">
          {/* Mobile Header */}
          <div className="md:hidden bg-white/90 backdrop-blur-sm border-b border-orange-200 shadow-sm sticky top-0 z-30">
            <div className="flex items-center justify-between p-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-2">
                <img 
                  src="https://mocha-cdn.com/01989249-2d23-7a9d-b9e9-11770605819c/Logo-1.png" 
                  alt="Mr. Eggs Nusantara Logo" 
                  className="w-8 h-8 rounded-lg object-contain bg-white"
                />
                <span className="font-bold text-gray-800 text-sm">Mr. Eggs</span>
              </div>
              
              <div className="w-9"></div> {/* Spacer for balance */}
            </div>
          </div>

          {/* Page Content */}
          <div className="p-4 md:p-6 transition-all duration-300">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
