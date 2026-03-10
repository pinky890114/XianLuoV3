
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const AdminWelcomePage: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem('nocy_admin_auth');
        navigate('/');
    };

    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh]">
            <div className="absolute top-4 right-4">
                <button onClick={handleLogout} className="text-siam-brown hover:text-red-600 font-bold transition-colors flex items-center gap-2 px-4 py-2 border border-siam-brown/20 rounded-lg hover:bg-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    登出
                </button>
            </div>

            <h1 className="text-4xl font-bold text-siam-dark mb-12">管理後台</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                <Link to="/admin/dolls" className="bg-siam-blue text-siam-cream p-8 rounded-lg shadow-lg hover:bg-siam-dark transition-all duration-300 ease-in-out transform hover:-translate-y-2 text-center">
                    <h2 className="text-3xl font-bold mb-2">小餅暹羅</h2>
                    <p>Nocy餅舖後台管理</p>
                </Link>
                <Link to="/admin/badges" className="bg-siam-brown text-siam-cream p-8 rounded-lg shadow-lg hover:bg-siam-dark transition-all duration-300 ease-in-out transform hover:-translate-y-2 text-center">
                    <h2 className="text-3xl font-bold mb-2">斂財暹羅</h2>
                    <p>暹羅地攤後台管理</p>
                </Link>
                <Link to="/admin/finance" className="md:col-span-2 bg-green-700 text-siam-cream p-6 rounded-lg shadow-lg hover:bg-green-800 transition-all duration-300 ease-in-out transform hover:-translate-y-2 text-center flex items-center justify-center gap-4">
                    <div className="text-left">
                        <h2 className="text-2xl font-bold mb-1">財務報表</h2>
                        <p className="text-sm opacity-90">收支管理與損益分析</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </Link>
            </div>
        </div>
    );
};

export default AdminWelcomePage;
