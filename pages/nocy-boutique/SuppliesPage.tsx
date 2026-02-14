
import React, { useState } from 'react';
import Modal from '../../components/Modal';

interface SupplyItem {
    name: string;
    price: string;
    imageUrl: string;
    descriptionPoints: (string | React.ReactNode)[];
}

const supplyItems: SupplyItem[] = [
    {
        name: '基礎款立牌包',
        price: '75元/個',
        imageUrl: 'https://i.ibb.co/HpHPGzRT/IMG-4596.jpg',
        descriptionPoints: [
            '大創賣的普通立牌包，每一個尺寸是11×2.5×16cm，適配大多數小餅的長寬（有帽子的不一定可以）',
            <React.Fragment key="stand-bag-desc-2">附圖有黑色的內裡跟背面樣式，我直接去大創網站上抓的，<strong>網站上直接買是隨機顏色出貨</strong></React.Fragment>,
            '顏色有黑、白、紅、粉、藍、紫、橘、黃、綠，可以挑色但現場不一定有，沒有的話可以退款或換其他顏色',
            '如果不確定自己的小餅裝不裝得下，可以在小餅到貨之後直接讓我帶去門市裡比對拍照或者拆我現在有的來裝看看'
        ]
    },
    {
        name: 'A5活頁收納袋',
        price: '8元/張',
        imageUrl: 'https://i.ibb.co/BVkD3BHT/image.png',
        descriptionPoints: [
            '有分成一頁單格或雙格的款式。尺寸及放置後的樣式可參考附圖',
            '我用來收納沒有穿的衣服，長髮或有髮冠建議用單格款，雙格適合裝衣服、飾品或短髮',
            '如果要挑選外殼需要孔距參考的話，1-2、2-3、4-5、5-6的孔距是19mm、3-4的距離則是70cm'
        ]
    },
    {
        name: '保護膜標籤紙',
        price: '4元/張',
        imageUrl: 'https://i.ibb.co/RpKQZZ6Y/image.png',
        descriptionPoints: [
            '每張有20個標籤貼紙，每一個尺寸是1.4×2.6cm',
            '是普通貼紙的升級版本，表面上有一層自黏塑膠膜，可以在寫完之後貼住，就不會磨損或暈開',
            '我會把外觀名字寫了貼在收納袋上，就可以知道這一格原先放的是哪一套衣服',
            '跟文具店賣的一模一樣，我也是去文具店買的，只是一包有200個貼紙感覺一般人用不完'
        ]
    },
    {
        name: '保麗龍膠',
        price: '13元/瓶',
        imageUrl: 'https://i.ibb.co/gbZVxm4h/image.png',
        descriptionPoints: [
            '一瓶是30ml，這是我目前能找到最小容量的包裝',
            '沒有什麼特別之處，只是我之前住的地方附近沒有文具店，所以覺得要另外找時間去買這種東西很麻煩',
            '如果小餅的衣服或配件玩久了有點鬆脫，可以用牙籤勾一些抹上去沾牢，記得不要碰到酒精'
        ]
    }
];

const SuppliesPage: React.FC = () => {
  const [selectedSupply, setSelectedSupply] = useState<SupplyItem | null>(null);

  return (
    <>
      <div className="bg-white/50 p-6 rounded-b-lg rounded-r-lg shadow-md">
        <div className="grid md:grid-cols-2 gap-8">
          {supplyItems.map((item) => (
            <div 
              key={item.name} 
              onClick={() => setSelectedSupply(item)}
              className="group block bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              aria-label={`查看 ${item.name} 的詳細資訊`}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter') setSelectedSupply(item); }}
            >
              <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-bold text-siam-dark group-hover:text-siam-blue transition-colors">{item.name}</h3>
                <p className="text-siam-brown">{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSupply && (
        <Modal isOpen={!!selectedSupply} onClose={() => setSelectedSupply(null)} title={selectedSupply.name}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                <img src={selectedSupply.imageUrl} alt={selectedSupply.name} className="rounded-lg shadow-md mx-auto" />
                <p className="text-lg font-bold text-siam-dark">{selectedSupply.price}</p>
                 <article className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-headings:text-siam-dark prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark">
                    <h3>說明：</h3>
                    <ul className="list-disc list-inside">
                        {selectedSupply.descriptionPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                </article>
            </div>
        </Modal>
      )}
    </>
  );
};

export default SuppliesPage;
