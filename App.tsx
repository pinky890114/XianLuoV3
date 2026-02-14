
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import HomePage from './pages/HomePage';
import NocyBoutiqueLayout from './pages/nocy-boutique/NocyBoutiqueLayout';
import IntroductionPage from './pages/nocy-boutique/IntroductionPage';
import SuppliesPage from './pages/nocy-boutique/SuppliesPage';
import AdoptionWizardPage from './pages/nocy-boutique/AdoptionWizardPage';
import SiamStallPage from './pages/SiamStallPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminWelcomePage from './pages/AdminWelcomePage';
import AdminDollsDashboardPage from './pages/AdminDollsDashboardPage';
import AdminBadgesDashboardPage from './pages/AdminBadgesDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function FooterContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const adminLinkDestination = isAdminPage ? '/' : '/admin';

  return (
    <footer className="w-full text-center py-4 text-siam-brown">
      <div className="flex flex-col justify-center items-center space-y-1">
         <span>© Shenli</span>
         {/* Only show the key icon if NOT on admin pages to keep backend cleaner */}
         {!isAdminPage && (
             <Link to={adminLinkDestination} aria-label="前往管理後台">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 hover:opacity-100 transition-opacity"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             </Link>
         )}
      </div>
    </footer>
  );
}


function App() {
  // 自動匿名登入邏輯：僅當目前沒有使用者登入時才執行。
  // 這確保了一般用戶可以存取資料庫，但不會覆蓋掉管理員的 Google 登入狀態。
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // 沒有使用者 (例如：剛進網站、或者管理員登出後) -> 嘗試匿名登入
        // 注意：這會導致在登入頁面管理員登出後，馬上又變成匿名使用者。
        // 但 ProtectedRoute 會檢查 email，匿名使用者沒有 email，所以依然會被擋在後台之外。
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous auth failed.", error);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <HashRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col font-sans text-siam-brown">
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/nocy-boutique" element={<NocyBoutiqueLayout />}>
              <Route index element={<IntroductionPage />} />
              <Route path="supplies" element={<SuppliesPage />} />
              <Route path="adoption" element={<AdoptionWizardPage />} />
            </Route>
            <Route path="/siam-stall" element={<SiamStallPage />} />
            <Route path="/order-status" element={<OrderStatusPage />} />
            
            {/* Admin Login Route */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminWelcomePage /></ProtectedRoute>} />
            <Route path="/admin/dolls" element={<ProtectedRoute><AdminDollsDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/badges" element={<ProtectedRoute><AdminBadgesDashboardPage /></ProtectedRoute>} />
          </Routes>
        </main>
        <FooterContent />
      </div>
    </HashRouter>
  );
}

export default App;
