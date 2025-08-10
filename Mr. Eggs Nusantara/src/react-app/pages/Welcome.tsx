import { useAuth } from "@getmocha/users-service/react";
import { usePermissions } from "@/react-app/hooks/usePermissions";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  UserPlus,
  Shield,
  CheckCircle,
  AlertTriangle,
  Mail,
  User
} from "lucide-react";

export default function Welcome() {
  const { user } = useAuth();
  const { appUser, loading, getRoleLabel } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user has been set up in app_users, redirect to normal dashboard
  if (appUser && appUser.is_active) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="https://mocha-cdn.com/01989249-2d23-7a9d-b9e9-11770605819c/Logo-1.png" 
            alt="Mr. Eggs Nusantara Logo" 
            className="w-20 h-20 rounded-2xl shadow-xl mb-6 mx-auto object-contain bg-white"
          />
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Selamat Datang di Mr. Eggs Nusantara! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Sistem Manajemen Bisnis Telur Terpercaya di Nusantara
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Account Ready</h3>
            <p className="text-green-700">Your account is fully configured</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Role: {getRoleLabel()}</h3>
            <p className="text-blue-700">Access level configured</p>
          </div>
          
          <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Profile</h3>
            <p className="text-purple-700">{user?.google_user_data?.name || user?.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Ready to Start!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">What you can do:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Manage suppliers and raw materials</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Track production and inventory</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Process sales with smart pricing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Monitor financial performance</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Quick Tips:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Start by adding suppliers and raw materials</li>
                <li>• Set up your product catalog with pricing tiers</li>
                <li>• Configure customer categories for better pricing</li>
                <li>• Use the dashboard to monitor daily operations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show setup required page for users not in app_users
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <img 
          src="https://mocha-cdn.com/01989249-2d23-7a9d-b9e9-11770605819c/Logo-1.png" 
          alt="Mr. Eggs Nusantara Logo" 
          className="w-20 h-20 rounded-2xl shadow-xl mb-6 mx-auto object-contain bg-white"
        />
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Mr. Eggs Nusantara! 👋
        </h1>
        <p className="text-xl text-gray-600">
          Your account needs administrator setup to continue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Login Successful</h3>
          <p className="text-green-700">You're authenticated with Google</p>
        </div>
        
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Setup Required</h3>
          <p className="text-orange-700">Account configuration pending</p>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 text-center">
          <UserPlus className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Contact Admin</h3>
          <p className="text-blue-700">Get your account activated</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">🔧 Setup Required</h2>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Your Account Details</h3>
                <p className="text-blue-700">Information for administrator setup</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <p className="text-gray-800">{user?.google_user_data?.name || 'Not provided'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="text-gray-800">{user?.email || 'Not provided'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">User ID:</span>
                <p className="text-gray-800 font-mono text-xs">{user?.id || 'Not available'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <p className="text-orange-600 font-medium">Pending Setup</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">📋 Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-700">
              <li>Contact your system administrator</li>
              <li>Provide your email and User ID above</li>
              <li>Administrator will configure your role and permissions</li>
              <li>Refresh the page once setup is complete</li>
            </ol>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Limited Access Available</h3>
            <p className="text-gray-600 mb-4">
              While waiting for full setup, you have limited access to:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>This dashboard view</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>User management (if you're an admin)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>Access control documentation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
