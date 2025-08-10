import { useAuth } from "@getmocha/users-service/react";
import { usePermissions } from "@/react-app/hooks/usePermissions";
import { AlertTriangle, UserPlus, X } from "lucide-react";
import { useState } from "react";

export default function UserSetupBanner() {
  const { user } = useAuth();
  const { appUser, loading } = usePermissions();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if loading, no user, already has app user, or dismissed
  if (loading || !user || appUser || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Setup Required</p>
            <p className="text-sm text-orange-100">
              Your account needs to be configured by an administrator to access all features.
              Currently showing limited functionality.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
            <UserPlus className="w-4 h-4" />
            <span className="text-sm font-medium">Contact Admin</span>
          </div>
          
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
