
import React from 'react';

const CareInstructions: React.FC = () => (
    <div className="w-full max-w-full space-y-4 border-2 border-dashed border-siam-brown/40 rounded-lg p-4 md:p-6 bg-siam-brown/5 mt-4">
        <h3 className="font-bold text-lg mb-2 text-siam-dark flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            養護指南
        </h3>
        <ul className="list-disc list-inside space-y-2 text-siam-brown break-words text-justify">
            <li>小餅有禁酒令不能碰酒。<strong>酒精會融化保麗龍膠</strong></li>
            <li>有些細節是用熱熔膠黏的，所以盡量不要用吹風機的熱風去吹。如果已經鬆動了就在吹化然後用力按住固定</li>
            <li>如果小餅髒髒了，可以用棉花娃清潔劑清洗，盡量不要直接泡水</li>
            <li>穿脫時要注意力道，如果出現開線的情況可以用針線縫補或用保麗龍膠黏上</li>
            <li>因為是手工製作所以難免會有膠絲或線頭，膠絲可以直接取下、線頭可以直接剪掉，硬化處理過了不會開線</li>
        </ul>
    </div>
);

export default CareInstructions;
