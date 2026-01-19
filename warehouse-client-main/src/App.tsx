// App.tsx
import { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from "react-router-dom";

import Layout from "./layouts/Layout";
import { useAppContext } from "./contexts/AppContext";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// ============================================
// LAZY LOADING - Code Splitting
// ============================================
// Public pages
const SignIn = lazy(() => import("./pages/SignIn"));
const Register = lazy(() => import("./pages/Register"));
// Quên mật khẩu - Lazy load ForgotPassword page
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// User pages - Core
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/user/dashboard/Dashboard"));

// User pages - Products
const Sanpham = lazy(() => import("./pages/user/sanpham/Sanpham"));
const Doitac = lazy(() => import("./pages/user/doitac/doitac"));
const Danhmuc = lazy(() => import("./pages/user/danhmuc/Danhmuc"));

// User pages - Inventory & Orders
const Nhaphang = lazy(() => import("./pages/user/nhaphang/Nhaphang"));
const ReceivingReport = lazy(() => import("./pages/user/nhaphang/ReceivingReport"));
const ReceivingPrintView = lazy(() => import("./pages/user/nhaphang/ReceivingPrintView"));
const InventoryPage = lazy(() => import("./pages/user/inventory/KhoHang"));
const PickingPage = lazy(() => import("./pages/user/phieuxuat/Xuathang"));
const Kiemke = lazy(() => import("./pages/user/kiemke/Kiemke"));

// User pages - Account
const Taikhoan = lazy(() => import("./pages/user/taikhoan/Taikhoan"));

// Admin pages
const Nhanvien = lazy(() => import("./pages/admin/nhanvien/Nhanvien"));
const PasswordResetRequests = lazy(() => import("./pages/admin/password-reset/PasswordResetRequests"));

const App = () => {
  const { isLoggedIn, role } = useAppContext();

  return (
    <Router>
      <Routes>
        {/* ====================== PUBLIC ====================== */}

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/" />
            ) : (
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <SignIn />
                </Suspense>
              </Layout>
            )
          }
        />

        <Route
          path="/register"
          element={
            isLoggedIn ? (
              <Navigate to="/" />
            ) : (
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Register />
                </Suspense>
              </Layout>
            )
          }
        />

        {/* Quên mật khẩu - Route cho trang reset password */}
        <Route
          path="/forgot-password"
          element={
            isLoggedIn ? (
              <Navigate to="/" />
            ) : (
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <ForgotPassword />
                </Suspense>
              </Layout>
            )
          }
        />

        {/* ====================== PROTECTED ====================== */}
        {isLoggedIn ? (
          <>
            {/* HOME */}
            <Route 
              path="/" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Home />
                  </Suspense>
                </Layout>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Dashboard />
                  </Suspense>
                </Layout>
              } 
            />

            {/* PRODUCT */}
            <Route 
              path="/sanpham" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Sanpham />
                  </Suspense>
                </Layout>
              } 
            />
            <Route 
              path="/doitac" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Doitac />
                  </Suspense>
                </Layout>
              } 
            />
            <Route 
              path="/danhmuc" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Danhmuc />
                  </Suspense>
                </Layout>
              } 
            />

            {/* ====================== NEW 4 PAGES ====================== */}

            {/* 2. RECEIVING (PHIẾU NHẬP) */}
            <Route 
              path="/nhaphang" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Nhaphang />
                  </Suspense>
                </Layout>
              } 
            />
            <Route 
              path="/nhaphang/baocao" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ReceivingReport />
                  </Suspense>
                </Layout>
              } 
            />
            <Route 
              path="/nhaphang/print/:receivingId" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ReceivingPrintView />
                  </Suspense>
                </Layout>
              } 
            />

            {/* 3. INVENTORY */}
            <Route 
              path="/khohang" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <InventoryPage />
                  </Suspense>
                </Layout>
              } 
            />
            <Route 
              path="/tonkho" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <InventoryPage />
                  </Suspense>
                </Layout>
              } 
            />

            {/* 4. PICKING (PHIẾU XUẤT) */}
            <Route 
              path="/phieuxuat" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <PickingPage />
                  </Suspense>
                </Layout>
              } 
            />

            {/* 5. STOCK TAKE (KIỂM KÊ) */}
            <Route 
              path="/kiemke" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Kiemke />
                  </Suspense>
                </Layout>
              } 
            />

            {/* ACCOUNT SETTINGS */}
            <Route 
              path="/taikhoan" 
              element={
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Taikhoan />
                  </Suspense>
                </Layout>
              } 
            />

            {/* ====================== ADMIN ONLY ====================== */}
            {role === "Admin" && (
              <>
                <Route
                  path="/admin/nhanvien"
                  element={
                    <Layout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Nhanvien />
                      </Suspense>
                    </Layout>
                  }
                />
                <Route
                  path="/admin/password-reset-requests"
                  element={
                    <Layout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <PasswordResetRequests />
                      </Suspense>
                    </Layout>
                  }
                />
              </>
            )}
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/" : "/login"} />}
        />
      </Routes>
    </Router>
  );
};

export default App;
