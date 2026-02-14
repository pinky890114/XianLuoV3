
import React from 'react';
import { Link } from 'react-router-dom';

const StandBagPage: React.FC = () => {
    return (
        <div className="bg-white/50 p-6 rounded-b-lg rounded-r-lg shadow-md space-y-6">
            <Link to="/nocy-boutique/supplies" className="text-siam-blue hover:text-siam-dark transition-colors inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                <span>返回用品列表</span>
            </Link>

            <article className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-headings:text-siam-dark prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark">
                <h2>基礎款立牌包</h2>
                <p className="text-lg font-bold">75元/個</p>
                <img src="https://i.ibb.co/HpHPGzRT/IMG-4596.jpg" alt="基礎款立牌包" className="rounded-lg shadow-md mx-auto" />
                <h3>說明：</h3>
                <ul>
                    <li>大創賣的普通立牌包，每一個尺寸是11×2.5×16cm，適配大多數小餅的長寬（有帽子的不一定可以）</li>
                    <li>附圖有黑色的內裡跟背面樣式，我直接去大創網站上抓的，<strong>網站上直接買是隨機顏色出貨</strong></li>
                    <li>顏色有黑、白、紅、粉、藍、紫、橘、黃、綠，可以挑色但現場不一定有，沒有的話可以退款或換其他顏色</li>
                    <li>如果不確定自己的小餅裝不裝得下，可以在小餅到貨之後直接讓我帶去門市裡比對拍照或者拆我現在有的來裝看看</li>
                </ul>
            </article>
        </div>
    );
};

export default StandBagPage;
