import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import AuthGuard from "@/react-app/components/AuthGuard";
import Layout from "@/react-app/components/Layout";
import HomePage from "@/react-app/pages/Home";
import EmployeesPage from "@/react-app/pages/Employees";
import SuppliersPage from "@/react-app/pages/Suppliers";
import RawMaterialsPage from "@/react-app/pages/RawMaterials";
import ProductsPage from "@/react-app/pages/Products";
import ProductionPage from "@/react-app/pages/Production";
import PurchasesPage from "@/react-app/pages/Purchases";
import CustomersPage from "@/react-app/pages/Customers";
import SalesPage from "@/react-app/pages/Sales";
import PricingPage from "@/react-app/pages/Pricing";
import FinancialPage from "@/react-app/pages/Financial";
import UsersPage from "@/react-app/pages/Users";
import AuthCallback from "@/react-app/pages/AuthCallback";
import AccessControlPage from "@/react-app/pages/AccessControl";
import SystemSettingsPage from "@/react-app/pages/SystemSettings";
import UserSettingsPage from "@/react-app/pages/UserSettings";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }>
            <Route index element={<HomePage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="raw-materials" element={<RawMaterialsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="financial" element={<FinancialPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="access-control" element={<AccessControlPage />} />
            <Route path="system-settings" element={<SystemSettingsPage />} />
            <Route path="user-settings" element={<UserSettingsPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
