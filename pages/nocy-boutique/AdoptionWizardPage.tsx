
import React, { useState, useMemo, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, doc, getDoc, Timestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebaseConfig';
import { HeadpieceCraft, Addon, OrderStatus } from '../../types';
import { DOLL_BASE_PRICE, DOLL_ADDONS } from '../../constants';
import { sendDollOrderNotification } from '../../services/discordService';
import { uploadAndCompressImage } from '../../utils/imageUploader';
import { syncOrderToGoogleSheet } from '../../services/googleSheetsService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import CareInstructions from '../../components/CareInstructions';

// Step 1: 委託流程 (Font size increased to text-lg/text-xl)
const CommissionProcess = () => (
    <div className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark prose-blockquote:font-sans space-y-8">
        <div>
            <h3 className="text-2xl font-bold text-siam-dark mb-3">Step 1: 詢價與下單</h3>
            <p className="text-lg">委託人提供圖片 → 老師確認後報價 → 委託人全款付款後領取批號（每批最多15隻） → 當月收單時掌櫃告知預計出貨日。</p>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-siam-dark mb-3">Step 2: 製作與確認</h3>
            <p className="text-lg">老師繪製效果圖 → 委託人確認無誤 → 老師開始製作 → 老師拍攝成品影片寄出。</p>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-siam-dark mb-3">Step 3: 寄送</h3>
            <p className="text-lg">掌櫃把小餅集運回台灣 → 掌櫃收到小餅後分裝寄出 → 委託人貨到付款並拿到成品。</p>
        </div>
        
        <div className="bg-siam-blue/10 p-6 rounded-lg border-l-4 border-siam-blue space-y-3">
            <p className="text-base font-bold text-siam-dark">關於費用：</p>
            <p className="text-base">以上過程會收兩次費用，海外夥伴另外討論寄送方式。</p>
            <ul className="list-disc list-inside ml-2 text-base">
                <li>第一次是給<strong>老師</strong>的委託費。</li>
                <li>第二次是給<strong>掌櫃</strong>的運費，包含從大陸集運倉到台灣、和寄到委託人手上的費用（貨到付款）。</li>
            </ul>
            <p className="text-base mt-2"><span className="font-bold text-siam-dark">關於工期：</span>通常是收單後1.5-2個月，具體根據該批次的數量評估，每批滿15隻就會提早收單。</p>
        </div>
    </div>
);

// Step 2: 委託說明 (Font size increased)
const CommissionDetails = () => (
    <div className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark prose-blockquote:font-sans space-y-8">
        <p className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-5 rounded-md font-bold text-lg">
            除了自家OC之外的定製商品均非買斷，會二次售賣（翻譯起來就是拒同擔慎約）。
        </p>
        
        <div>
            <h2 className="text-3xl font-bold text-siam-dark mb-4">價格部分</h2>
            <ul className="list-disc list-inside space-y-2 text-lg">
                <li>小餅的素體(裸體光頭娃娃) 每隻55元台幣，如果有大面積花紋則需另加15-30元</li>
                <li>頭髮+衣服+鞋子約落在600-800元左右，女孩子可能會因精細程度高而貴一點</li>
                <li>其他配飾、帽子、眼鏡、面罩、手持物件等需要提供清晰圖片估價</li>
                <li>需要在素體或物件上放置磁鐵的話，每個磁鐵5元</li>
                <li>為了方便記錄，我會把衣服+鞋子稱為全套，如果對於委託內容描述有疑問可以隨時提出</li>
            </ul>
            <p className="mt-4 font-bold text-siam-dark text-xl">實際報價會根據複雜度及工藝的不同進行增減，依老師看圖報價的金額為準。</p>
        </div>

        <div>
            <h2 className="text-3xl font-bold text-siam-dark mb-4">資料提供</h2>
            <ul className="list-disc list-inside space-y-2 text-lg">
                <li>正面全身、背面全身（有的話最好，沒有也不強求）</li>
                <li>正臉+髮型正面清晰圖</li>
                <li>正面上半身服裝及圖樣清晰圖</li>
                <li>正面下半身服裝及圖樣清晰圖（須包含鞋子）</li>
                <li>完整髮型背面圖</li>
            </ul>
            
            <div className="mt-6 space-y-3 bg-gray-50 p-6 rounded-lg text-base leading-relaxed">
                <p>⚠️ <strong>劍三ER請至少把畫質調整到電影、電影、電影以上再進商城截圖。</strong></p>
                <p>只要有清楚的OC立繪、服設，甚至購物網站上的模特展示圖都可以提供給老師參考估價。</p>
                <p>如果有頭飾、髮飾或耳朵，則需要選擇跟頭髮一體/可拆插入式/通用夾式。</p>
                <p className="text-red-600 font-bold text-lg">小餅的衣著髮型都以盡量還原正面為主，背後的裝飾和構造可能會被調整或省略。</p>
            </div>
            
            <p className="font-bold mt-6 text-xl">請分開提供細節圖如下：</p>
            <div className="mt-4">
                 <img src="https://i.ibb.co/kgmtfbTY/image.png" alt="細節圖參考範例" className="rounded-lg shadow-md w-full max-w-lg mx-auto" />
            </div>
        </div>
    </div>
);

const AdoptionWizardPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState('');
    const [title, setTitle] = useState('');
    const [headpieceCraft, setHeadpieceCraft] = useState<HeadpieceCraft>(HeadpieceCraft.INTEGRATED);
    const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
    const [remarks, setRemarks] = useState('');
    const [referenceImages, setReferenceImages] = useState<FileList | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCraftInfoModalOpen, setIsCraftInfoModalOpen] = useState(false);
    const [submittedOrderId, setSubmittedOrderId] = useState('');
    const [isShopOpen, setIsShopOpen] = useState<boolean | null>(null);

    // Check shop status on mount
    useEffect(() => {
        const checkShopStatus = async () => {
            try {
                // 確保在讀取資料庫前已登入(匿名)
                if (!auth.currentUser) {
                    try {
                        await signInAnonymously(auth);
                    } catch (e) {
                        console.error("Auto-login failed:", e);
                    }
                }

                // 改用 dollOrders 集合下的 store_config 文件，以避開 appSettings 的權限問題
                const docRef = doc(db, 'dollOrders', 'store_config');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setIsShopOpen(docSnap.data().isShopOpen ?? true);
                } else {
                    setIsShopOpen(true); // Default open if config doc missing
                }
            } catch (error) {
                console.error("Error checking shop status:", error);
                setIsShopOpen(true); // Fallback to open on error
            }
        };
        checkShopStatus();
    }, []);

    const toggleAddon = (addonId: string) => {
        setSelectedAddons(prev => {
            const newSet = new Set(prev);
            if (newSet.has(addonId)) newSet.delete(addonId);
            else newSet.add(addonId);
            return newSet;
        });
    };

    const calculatedPrice = useMemo(() => {
        let total = DOLL_BASE_PRICE;
        selectedAddons.forEach(id => {
            const addon = DOLL_ADDONS.find(a => a.id === id);
            if (addon) total += addon.price;
        });
        return total;
    }, [selectedAddons]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic Validation
        if (!nickname || !title) {
            alert("請填寫暱稱與委託標題！");
            return;
        }

        if (!referenceImages || referenceImages.length === 0) {
            alert("請上傳至少一張參考圖！");
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert FileList to Array for safer handling
            const files = Array.from(referenceImages) as File[];
            const imageUrls: string[] = [];
            
            for (const file of files) {
                const url = await uploadAndCompressImage(file, 'doll-orders', 'reference');
                imageUrls.push(url);
            }

            const orderId = `NOCY-${Date.now().toString().slice(-6)}`;
            const addonList: Addon[] = DOLL_ADDONS.filter(a => selectedAddons.has(a.id));

            // Use Timestamp.now() (or serverTimestamp) for Firestore, but we need a Date for sheet
            const now = new Date(); 
            const firestoreTimestamp = serverTimestamp(); // Use server timestamp for DB

            const newOrderData = {
                orderId,
                nickname,
                title,
                headpieceCraft,
                referenceImageUrls: imageUrls,
                remarks,
                addons: addonList,
                totalPrice: calculatedPrice,
                status: OrderStatus.PENDING,
                adminNotes: [],
                messages: [],
                progressImageUrls: [],
                createdAt: firestoreTimestamp,
            };

            await addDoc(collection(db, 'dollOrders'), newOrderData);

            // Send to Discord
            await sendDollOrderNotification({
                orderId,
                nickname,
                title,
                headpieceCraft,
                referenceImageUrls: imageUrls,
                remarks,
                addons: addonList,
                totalPrice: calculatedPrice
            });
            
            // Sync to Google Sheet (using client-side generated timestamp for simplicity in this flow)
            await syncOrderToGoogleSheet({
                ...newOrderData,
                createdAt: Timestamp.fromDate(now) // Convert to Firestore Timestamp object so helper can format it
            } as any);
            
            setSubmittedOrderId(orderId);
            setStep(4); // Go to success page

        } catch (error) {
            console.error("Error submitting order:", error);
            alert("提交失敗，請檢查網路連線或稍後再試。\n如果持續失敗，請聯絡管理員確認權限設定。");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isShopOpen === null) {
        return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
    }

    if (isShopOpen === false) {
        return (
            <div className="bg-white/50 p-12 rounded-b-lg rounded-r-lg shadow-md text-center min-h-[50vh] flex flex-col items-center justify-center">
                <div className="bg-siam-brown/10 p-6 rounded-full mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-siam-brown"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/><path d="M10 14h4"/></svg>
                </div>
                <h2 className="text-3xl font-bold text-siam-dark mb-4">餅舖歇業中，去地攤走走</h2>
                <p className="text-xl text-siam-brown mb-8">目前小餅委託暫時關閉，請關注最新公告或稍後再來。</p>
                <Link to="/siam-stall" className="bg-siam-brown text-siam-cream py-3 px-8 rounded-lg shadow-md hover:bg-siam-dark transition-all text-lg font-bold">
                    前往暹羅地攤
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white/50 p-6 rounded-b-lg rounded-r-lg shadow-md min-h-[60vh]">
            {/* Progress Steps Header */}
            <div className="flex justify-center mb-8">
                <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4].map((s) => (
                        <React.Fragment key={s}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                step >= s ? 'bg-siam-blue text-siam-cream' : 'bg-gray-300 text-gray-500'
                            }`}>
                                {s}
                            </div>
                            {s < 4 && <div className={`w-8 h-1 ${step > s ? 'bg-siam-blue' : 'bg-gray-300'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step 1: 委託流程 */}
            {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-3xl font-bold text-siam-dark border-b-2 border-siam-blue/30 pb-2">委託流程</h2>
                    <CommissionProcess />
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setStep(2)} className="bg-siam-brown text-siam-cream py-3 px-8 rounded-lg shadow-md hover:bg-siam-dark transition-all text-lg">
                            下一步：閱讀委託說明
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: 委託說明 */}
            {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-3xl font-bold text-siam-dark border-b-2 border-siam-blue/30 pb-2">委託說明</h2>
                    <CommissionDetails />
                    <div className="flex justify-between pt-4">
                         <button onClick={() => setStep(1)} className="bg-gray-400 text-white py-3 px-8 rounded-lg shadow-md hover:bg-gray-500 transition-all text-lg">
                            上一步
                        </button>
                        <button onClick={() => setStep(3)} className="bg-siam-brown text-siam-cream py-3 px-8 rounded-lg shadow-md hover:bg-siam-dark transition-all text-lg font-bold">
                            已詳細閱讀，領養小餅
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: 委託單 */}
            {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                    <h2 className="text-3xl font-bold text-siam-dark border-b-2 border-siam-blue/30 pb-2">小餅認養單</h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-bold text-siam-dark mb-2">暱稱 *</label>
                            <input 
                                type="text" 
                                value={nickname} 
                                onChange={e => setNickname(e.target.value)}
                                className="w-full p-2 rounded-lg border border-siam-blue/30 focus:border-siam-blue focus:ring-2 focus:ring-siam-blue outline-none transition-all"
                                placeholder="例：大江"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-bold text-siam-dark mb-2">委託標題 *</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)}
                                className="w-full p-2 rounded-lg border border-siam-blue/30 focus:border-siam-blue focus:ring-2 focus:ring-siam-blue outline-none transition-all"
                                placeholder="例：小江秦始皇套"
                                required
                            />
                        </div>
                    </div>

                    <div>
                         <div className="flex items-center gap-2 mb-2">
                            <label className="block text-lg font-bold text-siam-dark">頭飾工藝 *</label>
                            <button 
                                type="button" 
                                onClick={() => setIsCraftInfoModalOpen(true)} 
                                className="text-siam-blue hover:text-siam-dark bg-siam-blue/10 rounded-full p-1 transition-colors" 
                                aria-label="查看頭飾工藝說明"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </button>
                        </div>
                        <select 
                            value={headpieceCraft} 
                            onChange={e => setHeadpieceCraft(e.target.value as HeadpieceCraft)} 
                            className="w-full p-2 border border-siam-blue/30 rounded-lg focus:ring-2 focus:ring-siam-dark outline-none bg-white"
                        >
                            {Object.values(HeadpieceCraft).map(craft => <option key={craft} value={craft}>{craft}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-lg font-bold text-siam-dark mb-2">加購配件</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border border-siam-blue/20 rounded-lg bg-white/30">
                            {DOLL_ADDONS.map(addon => (
                                <label key={addon.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white/50 p-2 rounded transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedAddons.has(addon.id)} 
                                        onChange={() => toggleAddon(addon.id)} 
                                        className="h-5 w-5 rounded border-gray-300 text-siam-blue focus:ring-siam-dark"
                                    />
                                    <span className="text-siam-brown">{addon.name} <span className="text-siam-blue font-bold">+{addon.price}元</span></span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-lg font-bold text-siam-dark mb-2">參考圖 (必填) *</label>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            onChange={e => setReferenceImages(e.target.files)}
                            required
                            className="w-full text-sm text-siam-brown file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-siam-blue file:text-siam-cream hover:file:bg-siam-dark cursor-pointer"
                        />
                         <p className="text-sm text-siam-brown mt-2">
                            請上傳：<br/>
                            1. 正面全身<br/>
                            2. 背面全身<br/>
                            3. 正臉+髮型正面清晰圖<br/>
                            4. 正面上半身服裝及圖樣清晰圖<br/>
                            5. 正面下半身服裝及圖樣清晰圖（須包含鞋子）<br/>
                            <strong>(支援多張上傳)</strong>
                        </p>
                    </div>

                    <div>
                        <label className="block text-lg font-bold text-siam-dark mb-2">備註</label>
                        <textarea 
                            value={remarks} 
                            onChange={e => setRemarks(e.target.value)} 
                            rows={3} 
                            className="w-full p-2 rounded-lg border border-siam-blue/30 focus:border-siam-blue focus:ring-2 focus:ring-siam-blue outline-none transition-all"
                            placeholder="有什麼想特別交代的嗎？"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-siam-blue/30">
                         <button type="button" onClick={() => setStep(2)} className="bg-gray-400 text-white py-3 px-8 rounded-lg shadow-md hover:bg-gray-500 transition-all text-lg">
                            上一步
                        </button>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-sm text-siam-brown">預估金額</p>
                                <p className="text-2xl font-bold text-siam-dark">NT$ {calculatedPrice}</p>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-siam-brown text-siam-cream py-3 px-8 rounded-lg shadow-md hover:bg-siam-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-bold"
                            >
                                {isSubmitting ? <><LoadingSpinner /> <span className="ml-2">提交中...</span></> : '送出委託'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Step 4: 成功頁面 */}
            {step === 4 && (
                <div className="text-center space-y-8 animate-fadeIn py-8">
                     <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-siam-dark">填單成功，等待掌櫃確認</h2>
                        <p className="mt-4 text-xl text-siam-brown">
                            您的訂單編號是：<br/>
                            <span className="font-mono text-4xl font-bold text-siam-blue select-all">{submittedOrderId}</span>
                        </p>
                        <p className="mt-2 text-siam-brown">請利用 <span className="font-bold">暱稱</span> 或 <span className="font-bold">訂單編號</span> 查詢進度</p>
                    </div>

                    <div className="text-left max-w-2xl mx-auto">
                        <CareInstructions />
                    </div>

                    <div className="pt-8">
                        <Link to="/order-status" className="bg-siam-blue text-siam-cream py-3 px-12 rounded-lg shadow-md hover:bg-siam-dark transition-all text-lg font-bold">
                            前往查詢進度
                        </Link>
                    </div>
                </div>
            )}

            {/* Craft Info Modal */}
            <Modal isOpen={isCraftInfoModalOpen} onClose={() => setIsCraftInfoModalOpen(false)} title="頭飾工藝說明">
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                        <h3 className="font-bold text-lg text-siam-dark">跟頭髮一體</h3>
                        <p className="mt-1 text-lg">與頭髮一體無法拆卸，優點是牢固不擔心遺失，缺點是無法自由進行搭配。適合太小或者角色的固定配件。</p>
                        <img src="https://i.ibb.co/5WJxJh49/image.png" alt="與頭髮一體 範例" className="mt-2 rounded-lg shadow-md w-full" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-siam-dark">可拆插入式</h3>
                        <p className="mt-1 text-lg">可拆插入式，優點是針對該髮型做設計、貼合效果最好，缺點是只能適用於同一款髮型。適合角色特定造型的搭配。</p>
                        <img src="https://i.ibb.co/SkC6Cdj/image.png" alt="可拆插入式 範例" className="mt-2 rounded-lg shadow-md w-full" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-siam-dark">通用夾式</h3>
                        <p className="mt-1 text-lg">通用夾式，優點是可以自由搭配大多數髮型使用，缺點是效果相對前兩種而言較差。適合多款造型的角色使用。</p>
                        <img src="https://i.ibb.co/gZkdgFLh/image.png" alt="通用夾式 範例" className="mt-2 rounded-lg shadow-md w-full" />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdoptionWizardPage;
