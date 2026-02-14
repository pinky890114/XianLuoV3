
import React from 'react';
import { Link } from 'react-router-dom';

const IntroductionPage: React.FC = () => {
  return (
    <div className="bg-white/50 p-6 rounded-b-lg rounded-r-lg shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-siam-dark border-b-2 border-siam-blue/30 pb-2">什麼是小餅？</h2>
      <p className="text-lg leading-relaxed">
        小餅其實是大陸的手作老師nocy做的一種可換裝式不織布娃娃，特色是跟劍三的乘黃小餅一樣扁得像是被壓過因此得名。
      </p>
      
      <div className="grid md:grid-cols-2 gap-6 my-6">
        <img src="https://i.ibb.co/Ld39cKQ7/att-5rw-Tm-NTEvgib2-RVz-HE-FV0-HH1-Mm9b-On-P0-Ri-EVe-K54b-M.jpg" alt="小餅介紹圖 1" className="rounded-lg shadow-md w-full h-auto object-cover" />
        <img src="https://i.ibb.co/v47RXBf8/att-Bm-Yv-RFTDw4673g-O-g4p-Iu-BWVw9og-N8-WWuf5-OGfl-Z0go.jpg" alt="小餅介紹圖 2" className="rounded-lg shadow-md w-full h-auto object-cover" />
      </div>

      <h3 className="text-2xl font-bold text-siam-dark">不論是自家OC、影視人物、動畫角色、喜歡的Vtuber，只要有清晰圖片老師都可以努力一下</h3>
      
      <p className="leading-relaxed">
        相比於普通的棉花娃，小餅有便宜、不占空間和方便攜帶的優點。
        不僅訂製一隻價格只要三位數，可以根據當天心情搭配OOTD，甚至放在立牌包裡就能輕鬆帶出門。
        更別說只要活頁本和收納袋就能直接打造小餅衣櫃，媽媽想罵你又亂花錢買娃娃都不一定能找到。
      </p>

      <div className="pt-4 text-center">
        <Link 
          to="/nocy-boutique/adoption" 
          className="inline-block bg-siam-brown text-siam-cream py-3 px-8 rounded-lg shadow-md hover:bg-siam-dark transition-all transform hover:-translate-y-1"
        >
          <span className="text-xl font-bold">帶走小餅</span>
        </Link>
      </div>
    </div>
  );
};

export default IntroductionPage;