
import React from 'react';
import { Link } from 'react-router-dom';

const StickerPage: React.FC = () => {
    return (
        <div className="bg-white/50 p-6 rounded-b-lg rounded-r-lg shadow-md space-y-6">
            <Link to="/nocy-boutique/supplies" className="text-siam-blue hover:text-siam-dark transition-colors inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                <span>返回用品列表</span>
            </Link>

            <article className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-headings:text-siam-dark prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark">
                <h2>保護膜標籤紙</h2>
                <p className="text-lg font-bold">4元/張</p>
                <img src="https://i.ibb.co/RpKQZZ6Y/image.png" alt="保護膜標籤紙" className="rounded-lg shadow-md mx-auto" />
                <h3>說明：</h3>
                <ul>
                    <li>每張有20個標籤貼紙，每一個尺寸是1.4×2.6cm</li>
                    <li>是普通貼紙的升級版本，表面上有一層自黏塑膠膜，可以在寫完之後貼住，就不會磨損或暈開</li>
                    <li>我會把外觀名字寫了貼在收納袋上，就可以知道這一格原先放的是哪一套衣服</li>
                    <li>跟文具店賣的一模一樣，我也是去文具店買的，只是一包有200個貼紙感覺一般人用不完</li>
                </ul>
            </article>
        </div>
    );
};

export default StickerPage;
