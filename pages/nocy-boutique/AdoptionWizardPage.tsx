
import React, { useState, useMemo, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, Timestamp, doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { HeadpieceCraft, OrderStatus, DollOrder } from '../../types';
import { DOLL_BASE_PRICE, DOLL_ADDONS } from '../../constants';
import { sendDollOrderNotification } from '../../services/discordService';
import { uploadAndCompressImage } from '../../utils/imageUploader';
import { syncOrderToGoogleSheet } from '../../services/googleSheetsService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CareInstructions from '../../components/CareInstructions';
import Modal from '../../components/Modal';

// Step 1: 委託流程 (Commission Process)
const CommissionProcess = () => (
    <div className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark prose-blockquote:font-sans space-y-8">
        <div>
            <h3 className="text-2xl font-bold text-siam-dark mb-3">Step 1: 詢價與下單</h3>
            <p className="text-lg">委託人填單提供資料(試算金額僅供參考)→老師確認後報價→委託人全款付款後訂單成立→當月收單時掌櫃告知預計出貨日</p>
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
            <p className="text-base mt-2"><span className="font-bold text-siam-dark">關於工期：</span>通常是收單後1.5-2個月，具體根據該批次的數量評估，<strong>每批收滿數量就會提早結單。</strong></p>
        </div>
    </div>
);

// Step 2: 委託說明 (Commission Details)
const CommissionDetails = () => (
    <div className="prose max-w-none text-siam-brown font-sans prose-headings:font-sans prose-strong:font-sans prose-strong:font-bold prose-strong:text-siam-dark prose-blockquote:font-sans space-y-8">
        <p className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-5 rounded-md font-bold text-lg">
            除了自家OC之外的定製商品均非買斷，會二次售賣（翻譯起來就是拒同擔慎約）。
        </p>
        
        <div>
            <h2 className="text-3xl font-bold text-siam-dark mb-4">價格部分</h2>
            <ul className="list-disc list-inside space-y-2 text-lg">
                <li>小餅的素體(裸體光頭娃娃) 每隻55元台幣，如果有大面積花紋則需另加15-30元。</li>
                <li>頭髮+衣服+鞋子約落在600-800元左右，女孩子可能會因精細程度高而貴一點。</li>
                <li>其他配飾、帽子、眼鏡、面罩、手持物件等需要提供清晰圖片估價。</li>
                <li>需要在素體或物件上放置磁鐵的話，每個磁鐵5元。</li>
                <li>為了方便記錄，我會把衣服+鞋子稱為全套，如果對於委託內容描述有疑問可以隨時提出。</li>
                <li className="font-bold text-siam-dark">實際報價會根據複雜度及工藝的不同進行增減，依老師看圖報價的金額為準。</li>
            </ul>
        </div>

        <div>
            <h2 className="text-3xl font-bold text-siam-dark mb-4">資料提供</h2>
            <ul className="list-disc list-inside space-y-2 text-lg mb-4">
                <li>正面全身、背面全身（有的話最好，沒有也不強求）</li>
                <li>正臉+髮型正面清晰圖</li>
                <li>正面上半身服裝及圖樣清晰圖</li>
                <li>正面下半身服裝及圖樣清晰圖（須包含鞋子）</li>
                <li>完整髮型背面圖</li>
            </ul>
            
            <p className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md font-bold mb-4">
                ⚠️ 劍三ER請至少把畫質調整到電影、電影、電影以上再進商城截圖。
            </p>

            <div className="space-y-4 text-lg">
                <p>只要有清楚的OC立繪、服設，甚至購物網站上的模特展示圖都可以提供給老師參考估價。</p>
                <p>如果有頭飾、髮飾或耳朵，則需要選擇跟頭髮一體/可拆插入式/通用夾式。</p>
                <p>小餅的衣著髮型都以盡量還原正面為主，背後的裝飾和構造可能會被調整或省略。</p>
            </div>

            <div className="mt-6">
                <p className="font-bold text-siam-dark mb-2 text-lg">請分開提供細節圖如下：</p>
                <div className="rounded-lg overflow-hidden border-2 border-siam-blue/20">
                    <img 
                        src="https://i.ibb.co/kgmtfbTY/image.png" 
                        alt="細節圖範例" 
                        className="w-full h-auto object-cover" 
                    />
                </div>
            </div>
        </div>
    </div>
);

const AdoptionWizardPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedOrderId, setSubmittedOrderId] = useState('');
    const [isCraftInfoModalOpen, setIsCraftInfoModalOpen] = useState(false);

    // Shop Status State
    const [isShopOpen, setIsShopOpen] = useState(true);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    // Form Data States
    const [nickname, setNickname] = useState('');
    const [title, setTitle] = useState('');
    const [headpieceCraft, setHeadpieceCraft] = useState<HeadpieceCraft>(HeadpieceCraft.NONE);
    const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
    const [remarks, setRemarks] = useState('');
    const [referenceImages, setReferenceImages] = useState<FileList | null>(null);

    useEffect(() => {
        const configDocRef = doc(db, 'dollOrders', 'store_config');
        
        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(configDocRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().isShopOpen === false) {
                setIsShopOpen(false);
            } else {
                setIsShopOpen(true);
            }
            setIsCheckingStatus(false);
        }, (error) => {
            console.error("Error listening to shop status:", error);
            setIsShopOpen(true); // Fail open to not interrupt service
            setIsCheckingStatus(false);
        });

        return () => unsubscribe();
    }, []);

    // Calculate total price based on base price and selected addons
    const totalPrice = useMemo(() => {
        let total = DOLL_BASE_PRICE;
        selectedAddons.forEach(id => {
            const addon = DOLL_ADDONS.find(a => a.id === id);
            if (addon) total += addon.price;
        });
        return total;
    }, [selectedAddons]);

    const handleAddonToggle = (id: string) => {
        const next = new Set(selectedAddons);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedAddons(next);
    };

    // Handle form submission to Firebase and external services
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname || !title || !referenceImages || referenceImages.length === 0) {
            alert('請填寫完整資料並上傳參考圖');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload and compress reference images
            const uploadPromises = Array.from(referenceImages).map((file: File) => 
                uploadAndCompressImage(file, 'doll-references', 'reference')
            );
            const imageUrls = await Promise.all(uploadPromises);

            const orderId = `NOCY-${Date.now().toString().slice(-6)}`;
            const addons = DOLL_ADDONS.filter(a => selectedAddons.has(a.id));
            
            const now = Timestamp.now();
            const orderData: Omit<DollOrder, 'id'> = {
                orderId,
                nickname,
                title,
                headpieceCraft,
                referenceImageUrls: imageUrls,
                remarks,
                addons,
                totalPrice,
                status: OrderStatus.PENDING,
                adminNotes: [],
                messages: [],
                progressImageUrls: [],
                createdAt: serverTimestamp() as Timestamp
            };

            // 2. Save order to Firestore
            await addDoc(collection(db, 'dollOrders'), orderData);
            
            // 3. Sync to Google Sheets for backup
            await syncOrderToGoogleSheet({ ...orderData, createdAt: now } as any, 'doll');
            
            // 4. Send notification to Discord via webhook
            await sendDollOrderNotification({
                nickname,
                title,
                headpieceCraft,
                totalPrice,
                addons,
                remarks,
                referenceImageUrls: imageUrls,
                orderId
            });

            setSubmittedOrderId(orderId);
            setStep(4);
        } catch (error) {
            console.error("Submit error:", error);
            alert("提交失敗，請檢查網路連線後重試。");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingStatus) {
        return (
            <div className="flex justify-center items-center h-[40vh]">
                <LoadingSpinner />
            </div>
        );
    }
    
    if (!isShopOpen) {
        return (
            <div className="text-center py-20 px-6 bg-white/50 rounded-lg shadow-md min-h-[40vh] flex flex-col justify-center items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-siam-blue mb-6"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                <h2 className="text-4xl font-bold text-siam-dark mb-8">餅舖歇業中，去其他地方逛逛</h2>
                <Link 
                    to="/siam-stall" 
                    className="inline-block bg-siam-brown text-siam-cream py-4 px-10 rounded-lg shadow-lg hover:bg-siam-dark transition-all transform hover:-translate-y-1 font-bold text-lg"
                >
                    前往暹羅的地攤
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white/50 p-6 rounded-b-lg rounded-r-lg shadow-md min-h-[60vh]">
            {step === 1 && (
                <div className="space-y-8 animate-fadeIn">
                    <CommissionProcess />
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setStep(2)} className="bg-siam-blue text-siam-cream py-3 px-10 rounded-lg shadow-md font-bold hover:bg-siam-dark transition-all">下一步：閱讀委託說明</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-fadeIn">
                    <CommissionDetails />
                    <div className="flex justify-between pt-4">
                        <button onClick={() => setStep(1)} className="bg-gray-200 text-siam-brown py-3 px-10 rounded-lg font-bold hover:bg-gray-300">上一步</button>
                        <button onClick={() => setStep(3)} className="bg-siam-blue text-siam-cream py-3 px-10 rounded-lg shadow-md font-bold hover:bg-siam-dark transition-all">下一步：帶小餅回家</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-bold text-siam-dark border-b-2 border-siam-blue/30 pb-2">帶走小餅</h2>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <div>
                                <label className="block font-bold text-siam-dark mb-1">委託人暱稱 *</label>
                                <input type="text" required value={nickname} onChange={e => setNickname(e.target.value)} className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-siam-blue outline-none" placeholder="請務必記住，之後以暱稱做查詢及聯繫" />
                            </div>
                            <div>
                                <label className="block font-bold text-siam-dark mb-1">委託內容（一套外觀一單） *</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-siam-blue outline-none" placeholder="例：素體+頭髮+衣服，沒有就不寫" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="block font-bold text-siam-dark">頭飾工藝 *</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCraftInfoModalOpen(true)}
                                        className="text-xs bg-siam-blue/10 text-siam-blue px-2 py-0.5 rounded hover:bg-siam-blue hover:text-white transition-colors border border-siam-blue/20"
                                    >
                                        工藝說明
                                    </button>
                                </div>
                                <select value={headpieceCraft} onChange={e => setHeadpieceCraft(e.target.value as HeadpieceCraft)} className="w-full p-3 rounded-lg border bg-white focus:ring-2 focus:ring-siam-blue outline-none">
                                    <option value={HeadpieceCraft.NONE}>{HeadpieceCraft.NONE}</option>
                                    <option value={HeadpieceCraft.INTEGRATED}>{HeadpieceCraft.INTEGRATED}</option>
                                    <option value={HeadpieceCraft.DETACHABLE}>{HeadpieceCraft.DETACHABLE}</option>
                                    <option value={HeadpieceCraft.CLIPON}>{HeadpieceCraft.CLIPON}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold text-siam-dark mb-1">參考圖片 *</label>
                                <input type="file" required multiple accept="image/*" onChange={e => setReferenceImages(e.target.files)} className="w-full p-2 border rounded-lg text-sm" />
                                <p className="text-xs text-gray-400 mt-1">請上傳設定圖、正反面細節等</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block font-bold text-siam-dark mb-1">加購項目</label>
                                <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto p-3 bg-white/40 rounded-lg border">
                                    {DOLL_ADDONS.map(addon => (
                                        <label key={addon.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white/60 p-2 rounded transition-colors">
                                            <input type="checkbox" checked={selectedAddons.has(addon.id)} onChange={() => handleAddonToggle(addon.id)} className="w-4 h-4 text-siam-blue" />
                                            <span className="text-sm font-medium">{addon.name} (+${addon.price})</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block font-bold text-siam-dark mb-1">備註</label>
                                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-siam-blue outline-none" rows={4} placeholder="想要委託包身盒子、手持物件、耳墜、頭飾、耳朵、掛寵（依複雜程度加價）或者任何需要以文字描述的細節都可以寫在這裡" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-siam-blue/5 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <span className="text-xl font-bold text-siam-dark">訂做價格請以最後實際報價為準。</span>
                        </div>
                        <div className="flex flex-row gap-4 w-full md:w-auto">
                            <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-200 text-siam-brown py-3 px-8 rounded-lg font-bold hover:bg-gray-300 whitespace-nowrap">上一步</button>
                            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-siam-brown text-siam-cream py-3 px-12 rounded-lg shadow-md font-bold disabled:bg-gray-400 flex justify-center items-center whitespace-nowrap">
                                {isSubmitting ? <LoadingSpinner /> : '送出委託'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {step === 4 && (
                <div className="text-center space-y-8 animate-fadeIn py-16">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-4xl font-bold text-siam-dark">委託已成功送出！</h2>
                    <div className="bg-white p-8 rounded-xl shadow-md border-2 border-siam-blue/10 max-w-md mx-auto">
                        <p className="text-gray-500 text-sm mb-2">您的訂單編號</p>
                        <p className="text-4xl font-mono font-bold text-siam-blue tracking-widest">{submittedOrderId}</p>
                    </div>
                    <p className="text-lg text-siam-brown max-w-md mx-auto">請截圖保存編號，您可以隨時在首頁點擊「進度查詢」來追蹤小餅製作進度。</p>
                    <CareInstructions />
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Link to="/order-status" className="bg-siam-blue text-siam-cream py-4 px-10 rounded-lg font-bold shadow-lg hover:bg-siam-dark transition-all">前往查詢進度</Link>
                        <Link to="/" className="bg-white text-siam-dark border border-siam-dark/20 py-4 px-10 rounded-lg font-bold hover:bg-gray-50 transition-all">返回首頁</Link>
                    </div>
                </div>
            )}

            <Modal isOpen={isCraftInfoModalOpen} onClose={() => setIsCraftInfoModalOpen(false)} title="頭飾工藝說明">
                <div className="space-y-4 text-siam-brown">
                    <p className="text-base font-bold text-siam-dark bg-yellow-50 p-2 rounded border border-yellow-200">
                        頭飾是指貓耳這類，如果只是跟頭髮黏死的髮飾就算是沒有頭飾。
                    </p>

                    <div className="p-3 bg-white rounded border border-gray-100">
                        <h4 className="font-bold text-siam-dark mb-2 text-lg">跟頭髮一體</h4>
                        <img src="https://i.ibb.co/d0HJH4Mc/image.png" alt="跟頭髮一體範例" className="w-full h-auto rounded mb-2 object-cover border border-gray-200" />
                        <p className="text-sm leading-relaxed">與頭髮一體、無法拆卸，優點是牢固不擔心遺失，缺點是無法自由進行搭配。適合太小或者角色的固定配件。</p>
                    </div>
                    <div className="p-3 bg-white rounded border border-gray-100">
                        <h4 className="font-bold text-siam-dark mb-2 text-lg">可拆插入式</h4>
                        <img src="https://i.ibb.co/qHQDQWS/image.png" alt="可拆插入式範例" className="w-full h-auto rounded mb-2 object-cover border border-gray-200" />
                        <p className="text-sm leading-relaxed">針對該髮型做設計、貼合效果最好，缺點是只能適用於同一款髮型。適合角色特定造型的搭配。</p>
                    </div>
                    <div className="p-3 bg-white rounded border border-gray-100">
                        <h4 className="font-bold text-siam-dark mb-2 text-lg">通用夾式</h4>
                        <img src="https://i.ibb.co/gZkdgFLh/image.png" alt="通用夾式範例" className="w-full h-auto rounded mb-2 object-cover border border-gray-200" />
                        <p className="text-sm leading-relaxed">可以自由搭配大多數髮型使用，缺點是效果相對前兩種而言較差。適合有多款造型的角色使用。</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdoptionWizardPage;
