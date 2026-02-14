
import React from 'react';
import { Link } from 'react-router-dom';

const AdminWelcomePage: React.FC = () => {
    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh]">
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
            </div>
        </div>
    );
};

export default AdminWelcomePage;
