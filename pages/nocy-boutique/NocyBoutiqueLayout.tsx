
import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const NocyBoutiqueLayout: React.FC = () => {
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `py-2 px-3 sm:px-4 rounded-t-lg font-bold transition-colors text-base sm:text-lg whitespace-nowrap ${
        isActive
            ? 'bg-white/70 text-siam-dark'
            : 'bg-siam-blue/20 text-siam-blue hover:bg-siam-blue/40'
        }`;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <Link to="/" className="text-siam-blue hover:text-siam-dark transition-colors mb-4 inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>返回首頁</span>
            </Link>
            <h1 className="text-4xl font-bold text-siam-dark mb-2">Nocy餅舖</h1>
            <p className="text-xl text-siam-brown mb-8">小餅生產基地</p>

            <nav className="flex space-x-2 border-b-2 border-siam-blue/30 mb-6">
                <NavLink to="/nocy-boutique" end className={navLinkClass}>
                    小餅介紹
                </NavLink>
                <NavLink to="/nocy-boutique/supplies" className={navLinkClass}>
                    小餅用品
                </NavLink>
                <NavLink to="/nocy-boutique/adoption" className={navLinkClass}>
                    小餅認養
                </NavLink>
            </nav>

            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default NocyBoutiqueLayout;