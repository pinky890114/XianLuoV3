
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const badgeCategories = {
    '圓形': ['32mm', '44mm', '58mm', '75mm'],
    '方形': ['40mm', '50mm'],
    '心形': ['52mm x 57mm'],
    '特殊形狀': ['請洽客服'],
};

type MainCategory = keyof typeof badgeCategories;

const SiamStallPage: React.FC = () => {
    const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleMainCategorySelect = (category: MainCategory) => {
        setSelectedMainCategory(category);
        setSelectedSubCategory(null);
        setIsSubmitted(false);
    };

    const handleSubCategorySelect = (subCategory: string) => {
        setSelectedSubCategory(subCategory);
    };
    
    const handleSubmit = () => {
        if (selectedMainCategory && selectedSubCategory) {
            // In a real app, you would handle the submission logic here,
            // e.g., show a form, save to Firebase, etc.
            setIsSubmitted(true);
        } else {
            alert('請選擇完整的規格！');
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <Link to="/" className="text-siam-blue hover:text-siam-dark transition-colors mb-4 inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>返回首頁</span>
            </Link>
            <h1 className="text-4xl font-bold text-siam-dark mb-2">暹羅地攤</h1>
            <p className="text-lg text-siam-brown mb-8">徽章多規格委託系統</p>

            <div className="bg-white/50 p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-siam-dark mb-4">1. 選擇大分類</h2>
                    <div className="flex flex-wrap gap-4">
                        {(Object.keys(badgeCategories) as MainCategory[]).map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleMainCategorySelect(cat)}
                                className={`py-2 px-4 rounded-lg font-bold transition-colors ${selectedMainCategory === cat ? 'bg-siam-dark text-siam-cream' : 'bg-siam-blue text-siam-cream hover:bg-siam-dark'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedMainCategory && (
                    <div className="border-t border-siam-blue pt-6">
                        <h2 className="text-2xl font-bold text-siam-dark mb-4">2. 選擇小分類</h2>
                        <div className="flex flex-wrap gap-4">
                            {badgeCategories[selectedMainCategory].map(subCat => (
                                <button
                                    key={subCat}
                                    onClick={() => handleSubCategorySelect(subCat)}
                                    className={`py-2 px-4 rounded-lg font-bold transition-colors ${selectedSubCategory === subCat ? 'bg-siam-dark text-siam-cream' : 'bg-siam-blue text-siam-cream hover:bg-siam-dark'}`}
                                >
                                    {subCat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {selectedMainCategory && selectedSubCategory && (
                   <div className="border-t border-siam-blue pt-6 text-center">
                        <p className="text-lg mb-4">您已選擇: <strong>{selectedMainCategory} - {selectedSubCategory}</strong></p>
                       <button onClick={handleSubmit} className="bg-siam-brown text-siam-cream py-3 px-8 rounded-lg shadow-md hover:bg-siam-dark transition-all">
                           確認選擇並填寫資料
                       </button>
                   </div>
                )}
                
                {isSubmitted && (
                    <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                        <p className="font-bold">選擇成功！</p>
                        <p>接下來將引導您填寫詳細委託資訊。 (此處為功能示意)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiamStallPage;