
import React from 'react';
import { Link } from 'react-router-dom';

const navButtons = [
    { 
        text: 'Nocy餅舖', 
        description: '小餅生產基地',
        path: '/nocy-boutique', 
        color: 'bg-siam-blue',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10Z"/><path d="M5 10a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H6a1 1 0 0 1-1-1Z"/><path d="M8.5 6a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H9.5a1 1 0 0 1-1-1Z"/><path d="M17.5 13a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H18.5a1 1 0 0 1-1-1Z"/><path d="M14 17.5a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H15a1 1 0 0 1-1-1Z"/><path d="M10 13a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H11a1 1 0 0 1-1-1Z"/></svg> 
    },
    { 
        text: '暹羅地攤', 
        description: '亮晶晶與軟綿綿',
        path: '/siam-stall', 
        color: 'bg-siam-brown',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M2 7v3a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V7"/></svg> 
    },
    { 
        text: '進度查詢', 
        description: '看看小餅在哪裡',
        path: '/order-status', 
        color: 'bg-siam-dark',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> 
    },
];

const SiameseCatIcon = () => (
    <div className="relative w-48 h-48 mx-auto mb-6 group">
        {/* Cat Ears */}
        <div className="absolute top-4 left-4 w-12 h-12 bg-siam-brown rotate-[-15deg] rounded-tl-full rounded-tr-lg shadow-inner group-hover:rotate-[-25deg] transition-transform duration-500"></div>
        <div className="absolute top-4 right-4 w-12 h-12 bg-siam-brown rotate-[15deg] rounded-tr-full rounded-tl-lg shadow-inner group-hover:rotate-[25deg] transition-transform duration-500"></div>
        
        {/* Cat Face */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-36 bg-siam-cream rounded-[45%] border-b-4 border-siam-brown/20 shadow-lg overflow-hidden">
            {/* Dark Mask (Siamese focus) */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-24 bg-siam-brown rounded-full blur-[2px] opacity-90"></div>
            
            {/* Eyes */}
            <div className="absolute top-14 left-10 w-6 h-4 bg-[#A5D8FF] rounded-full shadow-[0_0_10px_rgba(165,216,255,0.8)] flex items-center justify-center">
                <div className="w-2 h-3 bg-black rounded-full"></div>
            </div>
            <div className="absolute top-14 right-10 w-6 h-4 bg-[#A5D8FF] rounded-full shadow-[0_0_10px_rgba(165,216,255,0.8)] flex items-center justify-center">
                <div className="w-2 h-3 bg-black rounded-full"></div>
            </div>
            
            {/* Nose & Mouth */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3 h-2 bg-siam-dark rounded-full"></div>
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-6 h-3 border-b-2 border-siam-dark opacity-30 rounded-full"></div>
        </div>
        
        {/* Whiskers */}
        <div className="absolute top-24 -left-4 w-12 h-px bg-siam-brown/20 rotate-[10deg]"></div>
        <div className="absolute top-28 -left-4 w-12 h-px bg-siam-brown/20"></div>
        <div className="absolute top-24 -right-4 w-12 h-px bg-siam-brown/20 rotate-[-10deg]"></div>
        <div className="absolute top-28 -right-4 w-12 h-px bg-siam-brown/20"></div>
    </div>
);

const PawPrint = ({ className }: { className?: string }) => (
    <div className={`text-siam-brown opacity-10 pointer-events-none select-none ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 13c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zM7.5 12c.83 0 1.5-.67 1.5-1.5S8.33 9 7.5 9 6 9.67 6 10.5 6.67 12 7.5 12zm9 0c.83 0 1.5-.67 1.5-1.5S17.17 9 16.5 9 15 9.67 15 10.5s.67 12 1.5 12zM12 9c.83 0 1.5-.67 1.5-1.5S12.83 6 12 6s-1.5.67-1.5 1.5S11.17 9 12 9zm-4.5 0c.83 0 1.5-.67 1.5-1.5S8.33 6 7.5 6 6 6.67 6 7.5 6.67 9 7.5 9zm9 0c.83 0 1.5-.67 1.5-1.5S17.17 6 16.5 6 15 6.67 15 7.5s.67 9 1.5 9z"/>
        </svg>
    </div>
);

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 text-center bg-siam-cream relative overflow-hidden">
      {/* Background Decor */}
      <PawPrint className="absolute top-10 left-10 rotate-12" />
      <PawPrint className="absolute bottom-20 right-20 -rotate-12 scale-150" />
      <PawPrint className="absolute top-1/2 left-[-20px] rotate-45" />

      <header className="mb-12 relative z-10 animate-fadeIn">
        <SiameseCatIcon />
        <div className="flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-bold text-siam-dark drop-shadow-md tracking-tight">
            暹羅的賠錢生意
          </h1>
          <div className="w-24 h-1.5 bg-siam-brown/30 mt-4 rounded-full"></div>
          <p className="mt-4 text-xl text-siam-brown italic font-medium">
            「我本來只是個餅口飯子」
          </p>
        </div>
      </header>

      <nav className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl relative z-10 px-4">
        {navButtons.map((button, idx) => (
          <Link
            key={button.text}
            to={button.path}
            className={`${button.color} text-siam-cream p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-out transform hover:-translate-y-2 group relative overflow-hidden`}
          >
            {/* Background Paw Print */}
            <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-150 transition-transform duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/></svg>
            </div>

            <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                    {button.icon}
                </div>
                <div>
                    <span className="text-2xl font-bold block mb-1">{button.text}</span>
                    <span className="text-sm opacity-80 block">{button.description}</span>
                </div>
            </div>
          </Link>
        ))}
      </nav>

      {/* Discord Floating Badge */}
      <div className="mt-16 relative z-10">
        <a
            href="https://discord.gg/fF282dN8QU"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-siam-brown hover:text-siam-dark font-bold transition-colors py-2 px-4 rounded-full border border-siam-brown/20 hover:bg-white/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8.2 8.2 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.05.05 0 0 0-.018-.011 8.8 8.8 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.05.05 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.165 5.48 1.165 8.1 0a.05.05 0 0 1 .053.007c.08.066.164.132.248.195a.05.05 0 0 1 .015.019.05.05 0 0 1-.02.066 8.8 8.8 0 0 1-1.248.595.05.05 0 0 0-.01.059.05.05 0 0 0-.018.011c.236.466.51.909.818 1.329a.05.05 0 0 0 .056.019 13.3 13.3 0 0 0 3.995-2.02.05.05 0 0 0 .021-.037c.276-2.985-.72-6.008-2.648-9.125a.04.04 0 0 0-.02-.019ZM5.348 10.22c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/></svg>
            <span>加入 Discord 討論區</span>
        </a>
      </div>

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
