
import React from 'react';
import { Link } from 'react-router-dom';

const navButtons = [
    { 
        text: 'Nocy餅舖', 
        description: '小餅生產基地',
        path: '/nocy-boutique', 
        color: 'bg-siam-blue',
        textColor: 'text-siam-cream',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10Z"/><path d="M5 10a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H6a1 1 0 0 1-1-1Z"/><path d="M8.5 6a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H9.5a1 1 0 0 1-1-1Z"/><path d="M17.5 13a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H18.5a1 1 0 0 1-1-1Z"/><path d="M14 17.5a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H15a1 1 0 0 1-1-1Z"/><path d="M10 13a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H11a1 1 0 0 1-1-1Z"/></svg> 
    },
    { 
        text: '暹羅地攤', 
        description: '亮晶晶與軟綿綿周邊',
        path: '/siam-stall', 
        color: 'bg-siam-brown',
        textColor: 'text-siam-cream',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M2 7v3a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V7"/></svg> 
    },
    { 
        text: '進度查詢', 
        description: '看看小餅在哪裡',
        path: '/order-status', 
        color: 'bg-siam-dark',
        textColor: 'text-siam-cream',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> 
    },
];

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center p-6 text-center bg-siam-cream pt-32 md:pt-48">
      
      <header className="mb-16 animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-bold text-siam-dark tracking-wider mb-4">
          暹羅的賠錢生意
        </h1>
        <div className="w-16 h-1 bg-siam-brown/30 mx-auto rounded-full"></div>
        <p className="mt-6 text-xl text-siam-brown font-medium opacity-70 italic tracking-tight">
          「我本來只是個餅口飯子」
        </p>
      </header>

      <nav className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {navButtons.map((button) => (
            <Link
              key={button.text}
              to={button.path}
              className={`${button.color} ${button.textColor} p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center gap-4 border-2 border-transparent hover:border-white/20 aspect-auto md:aspect-[4/3]`}
            >
              <div className="bg-white/20 p-5 rounded-full">
                {button.icon}
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold block mb-2 tracking-wide">{button.text}</span>
                <span className="text-sm opacity-90 block font-medium">{button.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      <div className="mt-16 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
        <a
            href="https://discord.gg/fF282dN8QU"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-siam-brown hover:text-siam-dark font-bold transition-all py-3 px-8 rounded-full border-2 border-siam-brown/20 hover:bg-white/40 hover:border-siam-brown/40 hover:-translate-y-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/></svg>
            <span>加入 Discord 社群</span>
        </a>
      </div>

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.9s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
