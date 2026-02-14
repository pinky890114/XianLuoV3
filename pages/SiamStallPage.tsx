
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Product, OrderStatus, BadgeOrder } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { syncOrderToGoogleSheet } from '../services/googleSheetsService';
import { sendBadgeOrderNotification } from '../services/discordService';

const CATEGORIES = ['快閃櫥窗', '金屬徽章', '棉花製品'];

const SiamStallPage: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: 購物車選購, 2: 填寫資料, 3: 成功

    // Selection View States (僅控制當前顯示的商品列表，不影響購物車)
    const [viewCat, setViewCat] = useState<string>('');
    const [viewSeriesId, setViewSeriesId] = useState<string>('');
    
    // Global Cart State: Key = `${productId}_${specIndex}`, Value = quantity
    const [cart, setCart] = useState<Record<string, number>>({});
    const [isCartExpanded, setIsCartExpanded] = useState(false);

    // Form states
    const [nickname, setNickname] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedOrderId, setSubmittedOrderId] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, 'products'));
                const snap = await getDocs(q);
                const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                setProducts(list);
            } catch (err) {
                console.error("Error fetching products:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Filtered lists for UI
    const filteredSeries = useMemo(() => {
        return products.filter(p => p.categoryId === viewCat);
    }, [products, viewCat]);

    const viewingSeries = useMemo(() => {
        return products.find(p => p.id === viewSeriesId);
    }, [products, viewSeriesId]);

    // Calculate Cart Totals
    const { totalPrice, totalItems, cartDetails, summaryString } = useMemo(() => {
        let price = 0;
        let items = 0;
        const details: string[] = [];
        
        Object.entries(cart).forEach(([key, value]) => {
            const qty = Number(value);
            if (qty > 0) {
                const [pId, specIdxStr] = key.split('_');
                const specIdx = parseInt(specIdxStr);
                const product = products.find(p => p.id === pId);
                const spec = product?.specs[specIdx];

                if (product && spec) {
                    price += spec.price * qty;
                    items += qty;
                    details.push(`[${product.categoryId}] ${product.seriesName} - ${spec.specName} x${qty}`);
                }
            }
        });

        return { 
            totalPrice: price, 
            totalItems: items,
            cartDetails: details,
            summaryString: details.join('、\n')
        };
    }, [cart, products]);

    const updateCart = (productId: string, specIndex: number, delta: number) => {
        const key = `${productId}_${specIndex}`;
        setCart(prev => {
            const current = prev[key] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [key]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [key]: next };
        });
    };

    const handleInputChange = (productId: string, specIndex: number, value: string) => {
        const num = parseInt(value) || 0;
        const key = `${productId}_${specIndex}`;
        setCart(prev => {
            if (num <= 0) {
                const { [key]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [key]: num };
        });
    };

    const getQuantity = (productId: string, specIndex: number) => {
        return cart[`${productId}_${specIndex}`] || 0;
    };

    const resetSelection = () => {
        setCart({});
        setStep(1);
        setNickname('');
        setRemarks('');
        setViewSeriesId('');
        setViewCat('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname || totalItems === 0) return;

        setIsSubmitting(true);
        try {
            const orderId = `STALL-${Date.now().toString().slice(-6)}`;
            
            // Generate a concise title for the order list
            const productTitle = cartDetails.length === 1 
                ? cartDetails[0] 
                : `混合委託 (共${totalItems}件)`;

            const fullContentString = cartDetails.join('\n');
            const finalRemarks = remarks ? `${remarks}\n\n=== 委託內容 ===\n${fullContentString}` : `=== 委託內容 ===\n${fullContentString}`;
            
            const now = Timestamp.now(); 

            const orderData: Omit<BadgeOrder, 'id'> = {
                orderId,
                nickname,
                productTitle: fullContentString, 
                price: totalPrice,
                // Change initial status to QUANTITY_SURVEY
                status: OrderStatus.QUANTITY_SURVEY,
                messages: [],
                progressImageUrls: [],
                remarks: remarks || '無', 
                createdAt: serverTimestamp() as Timestamp
            };

            await addDoc(collection(db, 'badgeOrders'), orderData);
            
            await syncOrderToGoogleSheet({ 
                ...orderData, 
                createdAt: now 
            } as any, 'badge');

            // Send notification to Discord
            await sendBadgeOrderNotification({
                orderId,
                nickname,
                productTitle: fullContentString,
                price: totalPrice,
                remarks: remarks
            });

            setSubmittedOrderId(orderId);
            setStep(3);
        } catch (error) {
            console.error("Submit error:", error);
            alert("提交失敗，請檢查網路連線。");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><LoadingSpinner /></div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl min-h-screen">
            <Link to="/" className="text-siam-blue hover:text-siam-dark transition-colors mb-4 inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>返回首頁</span>
            </Link>

            {step === 1 && (
                <div className="space-y-8 animate-fadeIn pb-32">
                    <header>
                        <h1 className="text-4xl font-bold text-siam-dark mb-2">暹羅地攤</h1>
                        <p className="text-lg text-siam-brown">亮晶晶與軟綿綿周邊</p>
                    </header>

                    <div className="bg-white/60 p-6 rounded-xl shadow-lg border border-siam-blue/10 space-y-8">
                        {/* 1. 大分類 */}
                        <section>
                            <h2 className="text-xl font-bold text-siam-dark mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-siam-blue text-white rounded-full flex items-center justify-center text-xs">1</span>
                                要逛哪攤
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { setViewCat(cat); setViewSeriesId(''); }}
                                        className={`py-2 px-6 rounded-full font-bold transition-all shadow-sm ${viewCat === cat ? 'bg-siam-dark text-siam-cream' : 'bg-white text-siam-blue hover:bg-siam-blue/10 border border-siam-blue/20'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 2. 商品系列 */}
                        {viewCat && (
                            <section className="animate-slideUp">
                                <h2 className="text-xl font-bold text-siam-dark mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-siam-blue text-white rounded-full flex items-center justify-center text-xs">2</span>
                                    選擇商品
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredSeries.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setViewSeriesId(p.id)}
                                            className={`p-4 rounded-lg text-left transition-all border ${viewSeriesId === p.id ? 'bg-siam-blue text-white border-siam-blue shadow-md' : 'bg-white text-siam-brown border-gray-200 hover:border-siam-blue/50'}`}
                                        >
                                            <p className="font-bold">{p.seriesName}</p>
                                        </button>
                                    ))}
                                    {filteredSeries.length === 0 && <p className="text-gray-400 italic">這攤沒貨，去別攤逛逛</p>}
                                </div>
                            </section>
                        )}
                        
                        {/* 動態說明區塊 */}
                        {viewSeriesId && viewingSeries && (viewingSeries.basicDescription || viewingSeries.priceDescription) && (
                            <section className="animate-slideUp bg-siam-cream/30 p-4 rounded-lg border border-siam-blue/20 space-y-4">
                                {viewingSeries.basicDescription && (
                                    <div>
                                        <h3 className="text-sm font-bold text-siam-blue mb-1 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                            商品說明
                                        </h3>
                                        <div className="text-siam-brown text-sm whitespace-pre-wrap leading-relaxed">{viewingSeries.basicDescription}</div>
                                    </div>
                                )}
                                {viewingSeries.priceDescription && (
                                    <div className={`${viewingSeries.basicDescription ? 'border-t border-siam-blue/10 pt-3' : ''}`}>
                                        <h3 className="text-sm font-bold text-siam-blue mb-1 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                            價格相關
                                        </h3>
                                        <div className="text-siam-brown text-sm whitespace-pre-wrap leading-relaxed">{viewingSeries.priceDescription}</div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* 3. 規格選取與數量 */}
                        {viewSeriesId && viewingSeries && (
                            <section className="animate-slideUp">
                                <h2 className="text-xl font-bold text-siam-dark mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-siam-blue text-white rounded-full flex items-center justify-center text-xs">3</span>
                                    選擇規格與數量
                                </h2>
                                
                                {viewingSeries.specs.some(s => s.isActive) ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {viewingSeries.specs.map((spec, idx) => {
                                            if (!spec.isActive) return null;
                                            
                                            const qty = getQuantity(viewingSeries.id, idx);
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${qty > 0 ? 'bg-siam-cream border-siam-brown ring-1 ring-siam-brown/20' : 'bg-white border-gray-200'}`}
                                                >
                                                    <div className="flex items-center overflow-hidden">
                                                        <img src={spec.imageUrl || 'https://via.placeholder.com/60'} alt={spec.specName} className="w-14 h-14 rounded object-cover mr-3 flex-shrink-0" />
                                                        <div className="text-left min-w-0">
                                                            <p className="font-bold text-siam-dark truncate pr-2">{spec.specName}</p>
                                                            <p className="text-sm text-siam-blue">${spec.price}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button 
                                                            onClick={() => updateCart(viewingSeries.id, idx, -1)}
                                                            className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center font-bold"
                                                        >-</button>
                                                        <input 
                                                            type="number" 
                                                            value={qty}
                                                            onChange={(e) => handleInputChange(viewingSeries.id, idx, e.target.value)}
                                                            className="w-12 text-center p-1 border rounded bg-white font-bold text-siam-dark focus:ring-2 focus:ring-siam-blue outline-none"
                                                        />
                                                        <button 
                                                            onClick={() => updateCart(viewingSeries.id, idx, 1)}
                                                            className="w-8 h-8 rounded-full bg-siam-blue text-white hover:bg-siam-dark flex items-center justify-center font-bold"
                                                        >+</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="col-span-full text-center p-8 bg-gray-100 rounded-lg text-gray-500 font-bold text-lg">
                                        預購已終止，下次手快
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    {totalItems > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 transition-all duration-300">
                             {isCartExpanded && (
                                <div className="max-h-60 overflow-y-auto bg-gray-50 border-b border-gray-100 p-4 animate-slideUp">
                                    <div className="container mx-auto max-w-4xl">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-siam-dark">已選商品明細</h3>
                                            <button onClick={() => setIsCartExpanded(false)} className="text-gray-500 hover:text-gray-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                            </button>
                                        </div>
                                        <ul className="space-y-1 text-sm text-gray-700">
                                            {cartDetails.map((item, idx) => (
                                                <li key={idx} className="border-b border-gray-200 last:border-0 pb-1">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-white">
                                <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div 
                                        className="text-center sm:text-left flex-grow cursor-pointer group"
                                        onClick={() => setIsCartExpanded(!isCartExpanded)}
                                    >
                                        <div className="flex items-center justify-center sm:justify-start gap-2">
                                            <p className="text-sm text-gray-500">
                                                已選 <span className="font-bold text-siam-dark text-lg">{totalItems}</span> 件商品
                                            </p>
                                            <span className="text-siam-blue text-xs bg-siam-blue/10 px-2 py-0.5 rounded-full group-hover:bg-siam-blue group-hover:text-white transition-colors">
                                                {isCartExpanded ? '隱藏明細 ▼' : '查看明細 ▲'}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-siam-dark">總計: ${totalPrice}</p>
                                    </div>
                                    <button 
                                        onClick={() => setStep(2)}
                                        className="w-full sm:w-auto bg-siam-brown text-siam-cream py-3 px-10 rounded-lg shadow-md hover:bg-siam-dark transition-all font-bold text-lg"
                                    >
                                        去結帳
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="animate-fadeIn max-w-xl mx-auto">
                    <h2 className="text-3xl font-bold text-siam-dark mb-6">填寫委託資料</h2>
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-siam-blue/10 space-y-6">
                        <div className="p-4 bg-gray-50 rounded-lg text-sm mb-4">
                            <p className="font-bold text-siam-dark mb-2 text-lg">購物車內容：</p>
                            <div className="max-h-40 overflow-y-auto space-y-1 mb-2 pr-2 scrollbar-thin">
                                {cartDetails.map((item, i) => (
                                    <p key={i} className="text-gray-700 border-b border-gray-100 pb-1 last:border-0">{item}</p>
                                ))}
                            </div>
                            <div className="h-px bg-gray-200 my-2"></div>
                            <p className="text-siam-brown font-bold text-right text-xl">總金額：${totalPrice}</p>
                            <div className="mt-4 text-center">
                                <p className="text-lg font-bold text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg shadow-sm">
                                    ⚠️ 僅為初始大貨金額，不含國際運費、均攤費與國內運費。
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-siam-dark mb-2">暱稱 *</label>
                            <input 
                                type="text" required value={nickname} onChange={e => setNickname(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-siam-blue outline-none"
                                placeholder="請輸入您的暱稱"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-siam-dark mb-2">備註</label>
                            <textarea 
                                value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-siam-blue outline-none"
                                placeholder="如有特殊需求請在此說明"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all">
                                繼續選購
                            </button>
                            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-siam-brown text-siam-cream py-3 rounded-lg font-bold hover:bg-siam-dark transition-all flex justify-center items-center">
                                {isSubmitting ? <LoadingSpinner /> : '送出委託'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 3 && (
                <div className="text-center space-y-8 animate-fadeIn py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-3xl font-bold text-siam-dark">委託已送出！</h2>
                    <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md mx-auto">
                        <p className="text-gray-500 text-sm mb-1">您的訂單編號</p>
                        <p className="text-3xl font-mono font-bold text-siam-blue tracking-wider">{submittedOrderId}</p>
                    </div>
                    <p className="text-siam-brown">請妥善保存編號，您可以隨時查詢委託進度。</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                        <Link to="/order-status" className="bg-siam-blue text-siam-cream py-3 px-8 rounded-lg font-bold shadow-md">查詢進度</Link>
                        <button onClick={resetSelection} className="bg-white text-siam-dark border border-siam-dark/20 py-3 px-8 rounded-lg font-bold">返回地攤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiamStallPage;
