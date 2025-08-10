import { useAuth } from "@getmocha/users-service/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        // Redirect to home after successful authentication
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Authentication error:", error);
        // Redirect to home with error - the AuthGuard will handle redirecting to login
        navigate("/", { replace: true });
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="text-center">
        <img 
          src="https://mocha-cdn.com/01989249-2d23-7a9d-b9e9-11770605819c/Logo-1.png" 
          alt="Mr. Eggs Nusantara Logo" 
          className="w-16 h-16 rounded-2xl shadow-lg mb-6 mx-auto object-contain bg-white"
        />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Mr. Eggs Nusantara</h1>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Memproses login...</p>
        <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}
