import { useAuth } from "@getmocha/users-service/react";
import { useEffect } from "react";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isPending, redirectToLogin } = useAuth();

  useEffect(() => {
    if (!isPending && !user) {
      redirectToLogin();
    }
  }, [isPending, user, redirectToLogin]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Mengalihkan ke login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
