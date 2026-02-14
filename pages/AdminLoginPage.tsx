
import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebaseConfig';
import { ADMIN_EMAILS } from '../constants';

const AdminLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // 如果已經登入且在白名單內，直接導向管理首頁
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
                navigate('/admin');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (user.email && ADMIN_EMAILS.includes(user.email)) {
                navigate('/admin');
            } else {
                await signOut(auth);
                setError('抱歉，您的 Email 不在管理員名單中。');
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            
            if (err.code === 'auth/unauthorized-domain') {
                setError('網域未授權 (Unauthorized Domain)。\n請至 Firebase Console > Authentication > Settings > Authorized domains 新增目前網域。');
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError('登入取消：視窗已關閉。');
            } else if (err.code === 'auth/popup-blocked') {
                setError('登入視窗被瀏覽器封鎖，請允許彈出視窗後重試。');
            } else {
                setError(`登入失敗 (${err.code || '未知的錯誤'})，請重試。`);
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-siam-cream p-4">
            <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-siam-dark rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-siam-dark">管理後台登入</h1>
                    <p className="text-siam-brown text-sm mt-2">請使用授權的 Google 帳號登入</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm whitespace-pre-wrap text-left">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    {isLoggingIn ? (
                        <span>登入中...</span>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            使用 Google 帳號登入
                        </>
                    )}
                </button>
                
                <div className="mt-6">
                    <button onClick={() => navigate('/')} className="text-sm text-siam-blue hover:underline">
                        返回店鋪首頁
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
