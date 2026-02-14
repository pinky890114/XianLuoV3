
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, doc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { Product, ProductSpec, BadgeOrder, OrderStatus, BadgeOrderStatusArray } from '../types';
import { uploadAndCompressImage } from '../utils/imageUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { syncOrderToGoogleSheet } from '../services/googleSheetsService';

const CATEGORIES = ['快閃櫥窗', '金屬徽章', '棉花製品'];

const AdminBadgesDashboardPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<BadgeOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
    
    // UI states
    const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Modal UI states
    const [infoModalState, setInfoModalState] = useState<{ title: string; message: React.ReactNode } | null>(null);
    const [confirmModalState, setConfirmModalState] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; confirmText?: string; } | null>(null);

    // Add Series Modal state
    const [isAddSeriesModalOpen, setIsAddSeriesModalOpen] = useState(false);
    const [newSeriesName, setNewSeriesName] = useState('');
    const [newSeriesCategory, setNewSeriesCategory] = useState('');

    // Order Management States
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
    const [batchDeleteInput, setBatchDeleteInput] = useState('');
    
    // Order Edit Modal States
    const [isOrderEditModalOpen, setIsOrderEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<BadgeOrder | null>(null);
    const [editingOrderPrice, setEditingOrderPrice] = useState<number | ''>('');
    const [editingOrderRemarks, setEditingOrderRemarks] = useState('');
    const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus | null>(null);
    const [adminMessageInput, setAdminMessageInput] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // New Order (Manual Entry) States
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [newOrderCat, setNewOrderCat] = useState('');
    const [newOrderSeriesId, setNewOrderSeriesId] = useState('');
    const [newOrderSpecIndex, setNewOrderSpecIndex] = useState<number | null>(null);
    const [newOrderNickname, setNewOrderNickname] = useState('');
    const [newOrderPrice, setNewOrderPrice] = useState<number | ''>('');
    const [newOrderRemarks, setNewOrderRemarks] = useState('');
    const [newOrderStatusManual, setNewOrderStatusManual] = useState<OrderStatus>(OrderStatus.QUANTITY_SURVEY);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const pSnap = await getDocs(query(collection(db, 'products')));
            const pList = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            setProducts(pList);

            const oSnap = await getDocs(query(collection(db, 'badgeOrders')));
            const oList = oSnap.docs.map(d => ({ id: d.id, ...d.data() } as BadgeOrder));
            oList.sort((a, b) => (b.orderId > a.orderId ? 1 : -1));
            setOrders(oList);
            setSelectedOrderIds(new Set());

            await checkAndSeedRequiredSeries(pList);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const checkAndSeedRequiredSeries = async (existingProducts: Product[]) => {
        const requiredSeries = [
            { cat: '金屬徽章', name: '顧羨之-板磚系列' },
            { cat: '金屬徽章', name: '及時救難-卡牌系列' },
            { cat: '金屬徽章', name: '無音鍛章廳' },
            { cat: '金屬徽章', name: '擇木' },
            { cat: '金屬徽章', name: '睡個好覺' },
            { cat: '金屬徽章', name: '玄狐卜卦' },
            { cat: '金屬徽章', name: '一沓小本本' },
            { cat: '金屬徽章', name: '江無慮' },
            { cat: '棉花製品', name: '奇遇棉棉' },
            { cat: '棉花製品', name: '恰一口棉花' },
            { cat: '棉花製品', name: '美味廚房' },
            { cat: '棉花製品', name: 'yr庸人' },
            { cat: '棉花製品', name: '皮蛋瘦肉舟' },
            { cat: '棉花製品', name: '琴音攬星河' },
            { cat: '棉花製品', name: '大唐飽飽食堂' },
            { cat: '棉花製品', name: '嘗劍山莊' },
            { cat: '棉花製品', name: '梅有怪怪' }
        ];

        const batch = writeBatch(db);
        let hasUpdates = false;

        requiredSeries.forEach(item => {
            const exists = existingProducts.some(p => p.seriesName === item.name && p.categoryId === item.cat);
            if (!exists) {
                const newDocRef = doc(collection(db, 'products'));
                batch.set(newDocRef, {
                    categoryId: item.cat,
                    seriesName: item.name,
                    specs: [{ specName: '預設規格', price: 0, imageUrl: '', isActive: true }]
                });
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            await batch.commit();
        }
    };

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Product Management Logic ---

    const handleUpdateSpec = async (productId: string, specs: ProductSpec[]) => {
        setIsUpdating(true);
        try {
            await updateDoc(doc(db, 'products', productId), { specs });
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, specs } : p));
        } catch (err) {
            setInfoModalState({ title: '錯誤', message: '更新失敗' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleToggleActive = (productId: string, specIndex: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const newSpecs = [...product.specs];
        newSpecs[specIndex].isActive = !newSpecs[specIndex].isActive;
        handleUpdateSpec(productId, newSpecs);
    };

    const handleDeleteProduct = (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        setConfirmModalState({
            title: '確定要刪除整個系列嗎？',
            message: `此動作將永久移除「${product.seriesName}」，且無法復原。`,
            confirmText: '確認刪除',
            onConfirm: async () => {
                setIsUpdating(true);
                try {
                    await deleteDoc(doc(db, 'products', id));
                    setProducts(prev => prev.filter(p => p.id !== id));
                    setInfoModalState({ title: '成功', message: '系列已刪除' });
                } catch (err) {
                    setInfoModalState({ title: '錯誤', message: '刪除失敗' });
                } finally {
                    setIsUpdating(false);
                }
            }
        });
    };

    const handleAddSeries = (cat: string) => {
        setNewSeriesCategory(cat);
        setNewSeriesName('');
        setIsAddSeriesModalOpen(true);
    };

    const executeAddSeries = async () => {
        if (!newSeriesName.trim()) return;
        setIsUpdating(true);
        try {
            await addDoc(collection(db, 'products'), {
                categoryId: newSeriesCategory,
                seriesName: newSeriesName.trim(),
                specs: [{ specName: '預設規格', price: 0, imageUrl: '', isActive: false }] // Default inactive
            });
            await fetchData();
            setIsAddSeriesModalOpen(false);
            setInfoModalState({ title: '成功', message: '系列已新增' });
        } catch (err) {
            setInfoModalState({ title: '錯誤', message: '新增失敗' });
        } finally {
            setIsUpdating(false);
        }
    };

    const openProductEditModal = (p: Product) => {
        setEditingProduct(JSON.parse(JSON.stringify(p)));
        setIsProductEditModalOpen(true);
    };

    const handleAddSpecToEditing = () => {
        if (!editingProduct) return;
        setEditingProduct({
            ...editingProduct,
            specs: [...editingProduct.specs, { specName: '新規格', price: 0, imageUrl: '', isActive: false }] // Default inactive
        });
    };

    const handleRemoveSpecFromEditing = (idx: number) => {
        if (!editingProduct) return;
        const newSpecs = [...editingProduct.specs];
        newSpecs.splice(idx, 1);
        setEditingProduct({ ...editingProduct, specs: newSpecs });
    };

    const handleSaveEditingProduct = async () => {
        if (!editingProduct) return;
        setIsUpdating(true);
        try {
            await updateDoc(doc(db, 'products', editingProduct.id), {
                seriesName: editingProduct.seriesName,
                specs: editingProduct.specs,
                basicDescription: editingProduct.basicDescription || '',
                priceDescription: editingProduct.priceDescription || ''
            });
            await fetchData();
            setIsProductEditModalOpen(false);
            setInfoModalState({ title: '成功', message: '儲存成功' });
        } catch (err) {
            setInfoModalState({ title: '錯誤', message: '儲存失敗' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleImageChange = async (specIndex: number, file: File) => {
        if (!editingProduct) return;
        setIsUpdating(true);
        try {
            const oldUrl = editingProduct.specs[specIndex].imageUrl;
            if (oldUrl) {
                try { await deleteObject(ref(storage, oldUrl)); } catch (e) { console.warn("Old image delete failed"); }
            }
            const newUrl = await uploadAndCompressImage(file, 'badge-products', 'progress');
            const newSpecs = [...editingProduct.specs];
            newSpecs[specIndex].imageUrl = newUrl;
            setEditingProduct({ ...editingProduct, specs: newSpecs });
        } catch (err) {
            setInfoModalState({ title: '錯誤', message: '上傳失敗' });
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Order Batch Operations ---

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOrderIds(e.target.checked ? new Set(orders.map(o => o.id)) : new Set());
    };

    const toggleSelectOrder = (id: string) => {
        const newSet = new Set(selectedOrderIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedOrderIds(newSet);
    };

    const openBatchDeleteModal = () => {
        if (selectedOrderIds.size === 0) return;
        setBatchDeleteInput('');
        setIsBatchDeleteModalOpen(true);
    };

    const executeBatchDelete = async () => {
        if (batchDeleteInput !== '確認刪除') {
            setInfoModalState({ title: '錯誤', message: '輸入驗證碼錯誤。' });
            return;
        }
        
        setIsUpdating(true);
        try {
            const batch = writeBatch(db);
            const idsToDelete = Array.from(selectedOrderIds);
            
            for (const id of idsToDelete) {
                batch.delete(doc(db, 'badgeOrders', id));
            }
            
            await batch.commit();
            setInfoModalState({ title: '成功', message: `成功刪除 ${idsToDelete.length} 筆訂單。` });
            await fetchData();
            setIsBatchDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Batch delete error:", error);
            setInfoModalState({ title: '錯誤', message: '批次刪除失敗' });
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Order Edit Modal Logic ---

    const openOrderEditModal = (order: BadgeOrder) => {
        setSelectedOrder(order);
        setEditingOrderPrice(order.price);
        setEditingOrderRemarks(order.remarks);
        setNewOrderStatus(order.status);
        setAdminMessageInput('');
        setIsOrderEditModalOpen(true);
    };

    const handleUpdateOrder = async () => {
        if (!selectedOrder) return;
        setIsUpdating(true);
        try {
            const updates: any = {};
            if (newOrderStatus && newOrderStatus !== selectedOrder.status) updates.status = newOrderStatus;
            if (editingOrderPrice !== '' && Number(editingOrderPrice) !== selectedOrder.price) updates.price = Number(editingOrderPrice);
            if (editingOrderRemarks !== selectedOrder.remarks) updates.remarks = editingOrderRemarks;

            if (Object.keys(updates).length > 0) {
                 await updateDoc(doc(db, 'badgeOrders', selectedOrder.id), updates);
                 if (updates.status || updates.price || updates.remarks) {
                     await syncOrderToGoogleSheet({ ...selectedOrder, ...updates }, 'badge');
                 }
            }
            await fetchData();
            setIsOrderEditModalOpen(false);
            setInfoModalState({ title: '成功', message: '訂單已更新' });
        } catch (error) {
            setInfoModalState({ title: '錯誤', message: '更新失敗' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendAdminMessage = async () => {
        if (!selectedOrder || !adminMessageInput.trim()) return;
        setIsSendingMessage(true);
        try {
            const newMessage = { text: adminMessageInput.trim(), sender: 'admin' as const, timestamp: Timestamp.now() };
            await updateDoc(doc(db, 'badgeOrders', selectedOrder.id), { messages: arrayUnion(newMessage) });
            
            const updatedOrder = { ...selectedOrder, messages: [...(selectedOrder.messages || []), newMessage] };
            setSelectedOrder(updatedOrder as any);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder as any : o));
            
            setAdminMessageInput('');
        } catch (error) {
            setInfoModalState({ title: '錯誤', message: '訊息發送失敗' });
        } finally {
            setIsSendingMessage(false);
        }
    };

    // --- Manual Order Entry Logic ---

    const openNewOrderModal = () => {
        setNewOrderCat('');
        setNewOrderSeriesId('');
        setNewOrderSpecIndex(null);
        setNewOrderNickname('');
        setNewOrderPrice('');
        setNewOrderRemarks('');
        setNewOrderStatusManual(OrderStatus.QUANTITY_SURVEY); // Default to first step
        setIsNewOrderModalOpen(true);
    };

    const handleNewOrderSpecSelect = (seriesId: string, specIndex: number, price: number) => {
        setNewOrderSpecIndex(specIndex);
        setNewOrderPrice(price);
    };

    const handleCreateOrder = async () => {
        if (!newOrderNickname || newOrderPrice === '' || !newOrderSeriesId || newOrderSpecIndex === null) {
            setInfoModalState({ title: '提示', message: '請完整填寫：暱稱、商品規格與價格' });
            return;
        }

        setIsUpdating(true);
        try {
            const series = products.find(p => p.id === newOrderSeriesId);
            const spec = series?.specs[newOrderSpecIndex];
            
            if (!series || !spec) throw new Error("Product data not found");

            const orderId = `STALL-MANUAL-${Date.now().toString().slice(-6)}`;
            const productTitle = `[${newOrderCat}] ${series.seriesName} - ${spec.specName}`;
            
            const now = Timestamp.now(); 

            const orderData: Omit<BadgeOrder, 'id'> = {
                orderId,
                nickname: newOrderNickname,
                productTitle,
                price: Number(newOrderPrice),
                status: newOrderStatusManual, 
                messages: [],
                progressImageUrls: [],
                remarks: newOrderRemarks || '後台手動補單',
                createdAt: serverTimestamp() as Timestamp
            };

            await addDoc(collection(db, 'badgeOrders'), orderData);
            await syncOrderToGoogleSheet({ ...orderData, createdAt: now } as any, 'badge');

            setInfoModalState({ title: '成功', message: '補單成功！' });
            
            setNewOrderNickname('');
            setNewOrderRemarks('');
            setNewOrderSpecIndex(null);
            setNewOrderSeriesId('');
            setNewOrderPrice('');
            fetchData();
            setIsNewOrderModalOpen(false);
        } catch (error) {
            setInfoModalState({ title: '錯誤', message: '補單失敗' });
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredSeriesForNewOrder = products.filter(p => p.categoryId === newOrderCat);
    const selectedSeriesForNewOrder = products.find(p => p.id === newOrderSeriesId);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                {/* ... header content ... */}
                 <div>
                    <Link to="/admin" className="text-siam-blue hover:text-siam-dark transition-colors mb-2 inline-flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        <span>返回管理選單</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-siam-dark">斂財暹羅</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {activeTab === 'orders' && (
                        <>
                             {selectedOrderIds.size > 0 && (
                                <button 
                                    onClick={openBatchDeleteModal}
                                    className="bg-red-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-700 transition-all flex items-center gap-2"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    刪除選取 ({selectedOrderIds.size})
                                </button>
                            )}
                        </>
                    )}

                     <button 
                        onClick={openNewOrderModal} 
                        className="px-4 py-2 bg-siam-brown text-white rounded-md font-bold shadow hover:bg-siam-dark transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        新增訂單
                    </button>
                    <div className="bg-white p-1 rounded-lg shadow-sm border flex">
                        <button onClick={() => setActiveTab('products')} className={`px-6 py-2 rounded-md font-bold transition-all ${activeTab === 'products' ? 'bg-siam-blue text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>商品管理</button>
                        <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-md font-bold transition-all ${activeTab === 'orders' ? 'bg-siam-blue text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>訂單管理</button>
                    </div>
                </div>
            </header>

            {/* ... Content ... */}
            {isLoading ? (
                <div className="flex justify-center p-20"><LoadingSpinner /></div>
            ) : activeTab === 'products' ? (
                /* ... Product Tab ... */
                 <div className="space-y-12">
                    {CATEGORIES.map(cat => (
                        <div key={cat} className="space-y-4">
                            <div className="flex justify-between items-center border-b-2 border-siam-blue pb-2">
                                <h2 className="text-2xl font-bold text-siam-dark">{cat}</h2>
                                <button onClick={() => handleAddSeries(cat)} className="text-sm bg-siam-blue text-white px-3 py-1 rounded hover:bg-siam-dark">+ 新增系列</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.filter(p => p.categoryId === cat).map(product => (
                                    <div key={product.id} className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-bold text-siam-dark">{product.seriesName}</h3>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openProductEditModal(product)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                                    <button onClick={() => handleDeleteProduct(product.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {product.specs.map((spec, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                        <div className="flex items-center">
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${spec.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                            <span className={spec.isActive ? '' : 'text-gray-400 line-through'}>{spec.specName}</span>
                                                            <span className="ml-2 text-siam-blue font-bold">${spec.price}</span>
                                                        </div>
                                                        <button onClick={() => handleToggleActive(product.id, idx)} className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${spec.isActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{spec.isActive ? '停用' : '啟用'}</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ... Order Tab ... */
                <div className="bg-white rounded-xl shadow border p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-siam-blue">
                            <thead className="bg-siam-blue/10">
                                <tr>
                                    <th className="px-4 py-3 w-10"><input type="checkbox" className="h-4 w-4 text-siam-blue rounded border-gray-300 focus:ring-siam-blue cursor-pointer" checked={selectedOrderIds.size === orders.length && orders.length > 0} onChange={toggleSelectAll} /></th>
                                    <th className="py-3 px-2 text-left font-bold text-siam-dark">編號</th>
                                    <th className="py-3 px-2 text-left font-bold text-siam-dark">暱稱</th>
                                    <th className="py-3 px-2 text-left font-bold text-siam-dark w-1/3">訂單內容</th>
                                    <th className="py-3 px-2 text-left font-bold text-siam-dark">價格</th>
                                    <th className="py-3 px-2 text-left font-bold text-siam-dark">狀態</th>
                                    <th className="py-3 px-2 text-left font-bold text-siam-dark">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {orders.map(o => (
                                    <tr key={o.id} className={selectedOrderIds.has(o.id) ? 'bg-blue-50' : ''}>
                                        <td className="px-4 py-4 w-10"><input type="checkbox" className="h-4 w-4 text-siam-blue rounded border-gray-300 focus:ring-siam-blue cursor-pointer" checked={selectedOrderIds.has(o.id)} onChange={() => toggleSelectOrder(o.id)} /></td>
                                        <td className="py-4 px-2 font-mono text-xs text-siam-brown">{o.orderId}</td>
                                        <td className="py-4 px-2 font-bold text-siam-dark">{o.nickname}</td>
                                        <td className="py-4 px-2 text-sm text-gray-700 whitespace-pre-wrap">{o.productTitle}</td>
                                        <td className="py-4 px-2 font-bold text-siam-blue">${o.price}</td>
                                        <td className="py-4 px-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">{o.status}</span></td>
                                        <td className="py-4 px-2"><button onClick={() => openOrderEditModal(o)} className="text-siam-blue font-bold text-sm hover:underline">查看/編輯</button></td>
                                    </tr>
                                ))}
                                {orders.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-400">目前沒有訂單</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ... Add Series Modal ... */}
            <Modal isOpen={isAddSeriesModalOpen} onClose={() => setIsAddSeriesModalOpen(false)} title={`在 [${newSeriesCategory}] 新增系列`}>
                {/* ... content same as before ... */}
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">系列名稱</label>
                        <input 
                            type="text" 
                            value={newSeriesName} 
                            onChange={e => setNewSeriesName(e.target.value)} 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-siam-blue outline-none" 
                            placeholder="請輸入系列名稱..."
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setIsAddSeriesModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">取消</button>
                        <button onClick={executeAddSeries} disabled={isUpdating || !newSeriesName.trim()} className="px-6 py-2 bg-siam-blue text-white rounded font-bold disabled:opacity-50">
                            {isUpdating ? <LoadingSpinner /> : '確認新增'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ... Manual Order Modal ... */}
            <Modal isOpen={isNewOrderModalOpen} onClose={() => setIsNewOrderModalOpen(false)} title="手動新增訂單 (補單)" maxWidth="max-w-4xl">
                 <div className="space-y-6">
                    {/* ... Step 1, 2, 3 ... same as before */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">1. 選擇類別</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => { setNewOrderCat(cat); setNewOrderSeriesId(''); setNewOrderSpecIndex(null); }} className={`py-3 px-2 rounded border font-bold ${newOrderCat === cat ? 'bg-siam-dark text-white' : 'bg-white'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                    {newOrderCat && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">2. 選擇系列</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                                {products.filter(p => p.categoryId === newOrderCat).map(p => (
                                    <button key={p.id} onClick={() => { setNewOrderSeriesId(p.id); setNewOrderSpecIndex(null); }} className={`py-3 px-2 rounded border text-sm font-bold ${newOrderSeriesId === p.id ? 'bg-siam-blue text-white' : 'bg-white'}`}>{p.seriesName}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectedSeriesForNewOrder && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">3. 選擇規格</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {selectedSeriesForNewOrder.specs.map((spec, idx) => (
                                    <button key={idx} onClick={() => handleNewOrderSpecSelect(selectedSeriesForNewOrder.id, idx, spec.price)} className={`py-3 px-2 rounded border text-sm flex flex-col items-center ${newOrderSpecIndex === idx ? 'bg-siam-brown text-white' : 'bg-white'}`}><span>{spec.specName}</span><span className="text-xs">${spec.price}</span></button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <input type="text" value={newOrderNickname} onChange={e => setNewOrderNickname(e.target.value)} className="w-full p-2 border rounded" placeholder="暱稱" />
                        <input type="number" value={newOrderPrice} onChange={e => setNewOrderPrice(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 border rounded" placeholder="價格" />
                        <select value={newOrderStatusManual} onChange={e => setNewOrderStatusManual(e.target.value as OrderStatus)} className="w-full p-2 border rounded bg-white">
                             {/* Only Badge Statuses */}
                             {BadgeOrderStatusArray.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <textarea value={newOrderRemarks} onChange={e => setNewOrderRemarks(e.target.value)} className="w-full p-2 border rounded col-span-full" placeholder="備註" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button onClick={() => setIsNewOrderModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">取消</button>
                        <button onClick={handleCreateOrder} disabled={isUpdating} className="px-6 py-2 bg-siam-blue text-white rounded font-bold">{isUpdating ? <LoadingSpinner /> : '確認補單'}</button>
                    </div>
                </div>
            </Modal>

            {/* ... Product Edit Modal ... */}
            {editingProduct && (
                <Modal isOpen={isProductEditModalOpen} onClose={() => setIsProductEditModalOpen(false)} title="編輯商品系列" maxWidth="max-w-4xl">
                     {/* ... Same as before ... */}
                     <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">系列名稱</label>
                            <input type="text" value={editingProduct.seriesName} onChange={e => setEditingProduct({...editingProduct, seriesName: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">基本說明 (顯示於商品下方)</label>
                                <textarea 
                                    value={editingProduct.basicDescription || ''} 
                                    onChange={e => setEditingProduct({...editingProduct, basicDescription: e.target.value})} 
                                    className="w-full p-2 border rounded h-24"
                                    placeholder="輸入商品的基本介紹..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">價格說明 (顯示於商品下方)</label>
                                <textarea 
                                    value={editingProduct.priceDescription || ''} 
                                    onChange={e => setEditingProduct({...editingProduct, priceDescription: e.target.value})} 
                                    className="w-full p-2 border rounded h-24"
                                    placeholder="輸入價格相關說明..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><label className="text-sm font-bold text-gray-700">規格設定</label><button onClick={handleAddSpecToEditing} className="text-xs bg-siam-blue text-white px-2 py-1 rounded">新增規格</button></div>
                            <div className="grid grid-cols-1 gap-4">
                                {editingProduct.specs.map((spec, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg bg-gray-50 flex gap-4">
                                        <div className="w-24 h-24 bg-white border rounded overflow-hidden flex-shrink-0 relative group">
                                            {spec.imageUrl ? <img src={spec.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">無圖</div>}
                                            <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 cursor-pointer transition-all">更換圖片<input type="file" hidden accept="image/*" onChange={e => e.target.files && handleImageChange(idx, e.target.files[0])} /></label>
                                        </div>
                                        <div className="flex-grow grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="規格名" value={spec.specName} onChange={e => { const newSpecs = [...editingProduct.specs]; newSpecs[idx].specName = e.target.value; setEditingProduct({...editingProduct, specs: newSpecs}); }} className="p-1 border rounded text-sm" />
                                            <input type="number" placeholder="價格" value={spec.price} onChange={e => { const newSpecs = [...editingProduct.specs]; newSpecs[idx].price = Number(e.target.value); setEditingProduct({...editingProduct, specs: newSpecs}); }} className="p-1 border rounded text-sm" />
                                            <div className="col-span-2 flex justify-between items-center pt-2"><label className="flex items-center text-xs"><input type="checkbox" checked={spec.isActive} onChange={() => { const newSpecs = [...editingProduct.specs]; newSpecs[idx].isActive = !newSpecs[idx].isActive; setEditingProduct({...editingProduct, specs: newSpecs}); }} className="mr-1" /> 是否收單</label><button onClick={() => handleRemoveSpecFromEditing(idx)} className="text-red-500 text-xs">刪除</button></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t"><button onClick={() => setIsProductEditModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">取消</button><button onClick={handleSaveEditingProduct} disabled={isUpdating} className="px-6 py-2 bg-siam-blue text-white rounded font-bold">{isUpdating ? <LoadingSpinner /> : '儲存變更'}</button></div>
                    </div>
                </Modal>
            )}

            {/* 編輯訂單 Modal */}
            {selectedOrder && (
                <Modal isOpen={isOrderEditModalOpen} onClose={() => setIsOrderEditModalOpen(false)} title={`管理訂單: ${selectedOrder.nickname} - ${selectedOrder.orderId}`} maxWidth="max-w-4xl">
                    <div className="flex flex-col h-[80vh]">
                        <div className="bg-gray-50 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">訂單內容 (唯讀)</label>
                                <div className="p-2 bg-white border rounded text-sm text-gray-700 whitespace-pre-wrap max-h-20 overflow-y-auto">{selectedOrder.productTitle}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">訂單狀態</label>
                                <select value={newOrderStatus || ''} onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)} className="w-full p-2 border rounded bg-white">
                                    {/* Only BadgeOrderStatusArray */}
                                    {BadgeOrderStatusArray.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">總金額</label>
                                <input type="number" value={editingOrderPrice} onChange={(e) => setEditingOrderPrice(Number(e.target.value))} className="w-full p-2 border rounded" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">備註</label>
                                <textarea value={editingOrderRemarks} onChange={(e) => setEditingOrderRemarks(e.target.value)} className="w-full p-2 border rounded" rows={2} />
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-end">
                                <button onClick={handleUpdateOrder} disabled={isUpdating} className="bg-siam-blue text-white py-2 px-6 rounded font-bold shadow hover:bg-siam-dark text-sm">
                                    {isUpdating ? <LoadingSpinner /> : '儲存訂單變更'}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col flex-grow min-h-0 border-t pt-4 mt-2">
                            <h3 className="font-bold text-siam-dark mb-2">即時對話 / 備註</h3>
                            <div className="flex-grow bg-white border rounded-lg p-3 overflow-y-auto mb-3 space-y-3">
                                {(selectedOrder.messages || []).sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()).map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-2 max-w-[85%] rounded-lg text-sm ${msg.sender === 'admin' ? 'bg-siam-blue text-white rounded-tr-none' : 'bg-gray-100 border border-gray-200 rounded-tl-none'}`}>
                                            <p className="text-xs opacity-75 mb-1">{msg.sender === 'admin' ? '管理員' : '客戶'} - {new Date(msg.timestamp.toMillis()).toLocaleString()}</p>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!selectedOrder.messages || selectedOrder.messages.length === 0) && <p className="text-center text-gray-400 text-sm mt-10">尚無對話</p>}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={adminMessageInput} onChange={(e) => setAdminMessageInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendAdminMessage()} placeholder="輸入訊息..." className="flex-grow p-2 border rounded text-sm" />
                                <button onClick={handleSendAdminMessage} disabled={isSendingMessage || !adminMessageInput.trim()} className="bg-siam-brown text-white px-4 py-2 rounded text-sm whitespace-nowrap">發送</button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ... Batch Delete, Info, Confirm Modals ... */}
             <Modal isOpen={isBatchDeleteModalOpen} onClose={() => setIsBatchDeleteModalOpen(false)} title="⚠️ 批次刪除確認">
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                        <p className="font-bold text-lg mb-2">嚴重警告：此動作無法復原！</p>
                        <p>您即將永久刪除 <span className="font-bold text-xl">{selectedOrderIds.size}</span> 筆訂單。</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">請輸入「確認刪除」以執行此操作：</label>
                        <input type="text" value={batchDeleteInput} onChange={(e) => setBatchDeleteInput(e.target.value)} placeholder="確認刪除" className="w-full p-2 border border-red-300 rounded focus:ring-2 focus:ring-red-500 outline-none" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={() => setIsBatchDeleteModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded">取消</button>
                        <button onClick={executeBatchDelete} disabled={batchDeleteInput !== '確認刪除' || isUpdating} className="px-4 py-2 bg-red-600 text-white rounded flex items-center">{isUpdating ? <LoadingSpinner /> : '確認刪除'}</button>
                    </div>
                </div>
            </Modal>
             {infoModalState && (
                <Modal isOpen={!!infoModalState} onClose={() => setInfoModalState(null)} title={infoModalState.title}>
                    <div className="p-4 space-y-4">
                        <div className="text-siam-brown whitespace-pre-wrap">{infoModalState.message}</div>
                        <div className="flex justify-end">
                            <button onClick={() => setInfoModalState(null)} className="px-6 py-2 bg-siam-blue text-white rounded hover:bg-siam-dark">好的</button>
                        </div>
                    </div>
                </Modal>
            )}
            {confirmModalState && (
                <Modal isOpen={!!confirmModalState} onClose={() => setConfirmModalState(null)} title={confirmModalState.title}>
                    <div className="p-4 space-y-6">
                        <div className="text-siam-brown whitespace-pre-wrap">{confirmModalState.message}</div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setConfirmModalState(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">取消</button>
                            <button onClick={() => { confirmModalState.onConfirm(); setConfirmModalState(null); }} className="px-6 py-2 bg-siam-blue text-white rounded hover:bg-siam-dark">{confirmModalState.confirmText || '確認'}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminBadgesDashboardPage;
