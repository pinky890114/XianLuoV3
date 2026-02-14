
import React from 'react';
import { Link } from 'react-router-dom';

const PouchPage: React.FC = () => {
    return (
        <div className="bg-white/50 p-6 rounded-b-lg rounded-r-lg shadow-md space-y-6">
            <Link to="/nocy-boutique/supplies" className="text-siam-blue hover:text-siam-dark transition-colors inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                <span>返回用品列表</span>
            </Link>

            <article className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-headings:text-siam-dark prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark">
                <h2>A5活頁收納袋</h2>
                <p className="text-lg font-bold">8元/張</p>
                <img src="https://i.ibb.co/BVkD3BHT/image.png" alt="A5活頁收納袋" className="rounded-lg shadow-md mx-auto" />
                <h3>說明：</h3>
                <ul>
                    <li>有分成一頁單格或雙格的款式。尺寸及放置後的樣式可參考附圖</li>
                    <li>我用來收納沒有穿的衣服，長髮或有髮冠建議用單格款，雙格適合裝衣服、飾品或短髮</li>
                    <li>如果要挑選外殼需要孔距參考的話，1-2、2-3、4-5、5-6的孔距是19mm、3-4的距離則是70cm</li>
                </ul>
            </article>
        </div>
    );
};

export default PouchPage;
