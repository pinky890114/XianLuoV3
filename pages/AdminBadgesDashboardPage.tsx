
import React from 'react';
import { Link } from 'react-router-dom';

const AdminBadgesDashboardPage: React.FC = () => {
    return (
        <div className="container mx-auto p-4 md:p-8">
             <Link to="/admin" className="text-siam-blue hover:text-siam-dark transition-colors mb-4 inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                <span>返回管理選單</span>
            </Link>
            <h1 className="text-4xl font-bold text-siam-dark mb-6">你好，斂財暹羅</h1>
            <div className="bg-white/50 p-6 rounded-lg shadow-md text-center">
                <p className="text-siam-brown text-lg">徽章後台功能開發中，敬請期待！</p>
            </div>
        </div>
    );
};

export default AdminBadgesDashboardPage;
