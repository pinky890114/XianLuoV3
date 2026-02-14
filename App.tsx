
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
import AdminWelcomePage from './pages/AdminWelcomePage';
import AdminDollsDashboardPage from './pages/AdminDollsDashboardPage';
import AdminBadgesDashboardPage from './pages/AdminBadgesDashboardPage';

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
         <Link to={adminLinkDestination} aria-label={isAdminPage ? '返回首頁' : '前往管理後台'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 hover:opacity-100 transition-opacity"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
         </Link>
      </div>
    </footer>
  );
}


function App() {
  // 自動匿名登入，解決 "Missing or insufficient permissions" 問題
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous auth failed. Ensure 'Anonymous' provider is enabled in Firebase Console.", error);
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
            <Route path="/" element={<HomePage />} />
            <Route path="/nocy-boutique" element={<NocyBoutiqueLayout />}>
              <Route index element={<IntroductionPage />} />
              <Route path="supplies" element={<SuppliesPage />} />
              <Route path="adoption" element={<AdoptionWizardPage />} />
            </Route>
            <Route path="/siam-stall" element={<SiamStallPage />} />
            <Route path="/order-status" element={<OrderStatusPage />} />
            <Route path="/admin" element={<AdminWelcomePage />} />
            <Route path="/admin/dolls" element={<AdminDollsDashboardPage />} />
            <Route path="/admin/badges" element={<AdminBadgesDashboardPage />} />
          </Routes>
        </main>
        <FooterContent />
      </div>
    </HashRouter>
  );
}

export default App;
