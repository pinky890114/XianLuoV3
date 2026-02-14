
import React from 'react';
import { Link } from 'react-router-dom';

const GluePage: React.FC = () => {
    return (
        <div className="bg-white/50 p-6 rounded-b-lg rounded-r-lg shadow-md space-y-6">
            <Link to="/nocy-boutique/supplies" className="text-siam-blue hover:text-siam-dark transition-colors inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                <span>返回用品列表</span>
            </Link>

            <article className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-headings:text-siam-dark prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark">
                <h2>保麗龍膠</h2>
                <p className="text-lg font-bold">13元/瓶</p>
                <img src="https://i.ibb.co/gbZVxm4h/image.png" alt="保麗龍膠" className="rounded-lg shadow-md mx-auto" />
                <h3>說明：</h3>
                <ul>
                    <li>一瓶是30ml，這是我目前能找到最小容量的包裝</li>
                    <li>沒有什麼特別之處，只是我之前住的地方附近沒有文具店，所以覺得要另外找時間去買這種東西很麻煩</li>
                    <li>如果小餅的衣服或配件玩久了有點鬆脫，可以用牙籤勾一些抹上去沾牢，記得不要碰到酒精</li>
                </ul>
            </article>
        </div>
    );
};

export default GluePage;
