
import React from 'react';
import { Link } from 'react-router-dom';

const navButtons = [
    { text: 'Nocy餅舖', path: '/nocy-boutique', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10Z"/><path d="M5 10a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H6a1 1 0 0 1-1-1Z"/><path d="M8.5 6a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H9.5a1 1 0 0 1-1-1Z"/><path d="M17.5 13a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H18.5a1 1 0 0 1-1-1Z"/><path d="M14 17.5a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H15a1 1 0 0 1-1-1Z"/><path d="M10 13a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H11a1 1 0 0 1-1-1Z"/></svg> },
    { text: '暹羅地攤', path: '/siam-stall', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M2 7v3a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V7"/></svg> },
    { text: '訂單進度查詢', path: '/order-status', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> },
  ];
  
  const discordButton = {
      text: 'Discord',
      href: 'https://discord.gg/fF282dN8QU',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8.2 8.2 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.05.05 0 0 0-.018-.011 8.8 8.8 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.05.05 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.165 5.48 1.165 8.1 0a.05.05 0 0 1 .053.007c.08.066.164.132.248.195a.05.05 0 0 1 .015.019.05.05 0 0 1-.02.066 8.8 8.8 0 0 1-1.248.595.05.05 0 0 0-.01.059.05.05 0 0 0-.018.011c.236.466.51.909.818 1.329a.05.05 0 0 0 .056.019 13.3 13.3 0 0 0 3.995-2.02.05.05 0 0 0 .021-.037c.276-2.985-.72-6.008-2.648-9.125a.04.04 0 0 0-.02-.019ZM5.348 10.22c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/></svg>
  }

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 text-center bg-siam-cream">
      <header className="mb-12">
        <div className="flex justify-center items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-siam-dark opacity-80">
            <path d="M7.63,21.32C7.26,20.57,7,19.8,7,19A5,5,0,0,1,12,14A5,5,0,0,1,17,19C17,19.8,16.74,20.57,16.37,21.32C15.21,22.25,13.66,22.81,12,22.81C10.34,22.81,8.79,22.25,7.63,21.32M19,8A2,2,0,0,1,17,10A2,2,0,0,1,15,8A2,2,0,0,1,17,6A2,2,0,0,1,19,8M12,5A2,2,0,0,1,10,7A2,2,0,0,1,8,5A2,2,0,0,1,10,3A2,2,0,0,1,12,5M5,8A2,2,0,0,1,3,10A2,2,0,0,1,1,8A2,2,0,0,1,3,6A2,2,0,0,1,5,8Z" />
          </svg>
          <h1 className="text-4xl md:text-5xl font-bold text-siam-dark drop-shadow-lg">暹羅的賠錢生意</h1>
        </div>
        <p className="mt-4 text-xl text-siam-brown">我本來只是個餅口飯子</p>
      </header>

      <nav className="grid grid-cols-1 gap-6 w-full max-w-2xl">
        {navButtons.map((button) => (
          <Link
            key={button.text}
            to={button.path}
            className="bg-siam-blue text-siam-cream py-4 px-6 rounded-lg shadow-md hover:bg-siam-dark transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            {button.icon}
            <span className="text-xl font-bold">{button.text}</span>
          </Link>
        ))}
        <a
            href={discordButton.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-siam-brown text-siam-cream py-4 px-6 rounded-lg shadow-md hover:bg-siam-dark transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            {discordButton.icon}
            <span className="text-xl font-bold">{discordButton.text}</span>
        </a>
      </nav>
    </div>
  );
};

export default HomePage;
