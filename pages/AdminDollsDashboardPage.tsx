import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, updateDoc, Timestamp, arrayUnion, addDoc, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { DollOrder, OrderStatus, OrderStatusArray, HeadpieceCraft } from '../types';
import { DOLL_ADDONS } from '../constants';
import { uploadAndCompressImage } from '../utils/imageUploader';
import { syncOrderToGoogleSheet } from '../services/googleSheetsService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const AdminDollsDashboardPage: React.FC = () => {
    const [orders, setOrders] = useState<DollOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(true);
    const [isTogglingShop, setIsTogglingShop] = useState(false);
    
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<DollOrder | null>(null);
    const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);
    const [newImage, setNewImage] = useState<File | null>(null);
    const [editingPrice, setEditingPrice] = useState<number | ''>('');
    const [editingRemarks, setEditingRemarks] = useState('');
    
    const [adminMessageInput, setAdminMessageInput] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [newOrderNickname, setNewOrderNickname] = useState('');
    const [newOrderTitle, setNewOrderTitle] = useState('');
    const [newOrderPrice, setNewOrderPrice] = useState<number | ''>('');
    const [newOrderHeadpieceCraft, setNewOrderHeadpieceCraft] = useState<HeadpieceCraft>(HeadpieceCraft.INTEGRATED);
    const [newOrderImages, setNewOrderImages] = useState<FileList | null>(null);
    const [newOrderRemarks, setNewOrderRemarks] = useState('');
    const [newOrderAddons, setNewOrderAddons] = useState<Set<string>>(new Set());

    const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
    const [batchDeleteInput, setBatchDeleteInput] = useState('');

    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [isNoOldOrdersModalOpen, setIsNoOldOrdersModalOpen] = useState(false);
    const [cleanupCandidates, setCleanupCandidates] = useState<DollOrder[]>([]);
    const [selectedCleanupIds, setSelectedCleanupIds] = useState<Set<string>>(new Set());

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState('');

    // Modal states to replace window.alert and window.confirm
    const [infoModalState, setInfoModalState] = useState<{ title: string; message: React.ReactNode } | null>(null);
    const [confirmModalState, setConfirmModalState] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; confirmText?: string; } | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'dollOrders'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedOrders = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as DollOrder))
                .filter(doc => doc.id !== 'store_config');
            setOrders(fetchedOrders);
            setSelectedOrderIds(new Set());
        } catch (error) {
            console.error("Error fetching orders: ", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchShopStatus = useCallback(async () => {
        try {
            const docRef = doc(db, 'dollOrders', 'store_config');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setIsShopOpen(docSnap.data().isShopOpen ?? true);
            } else {
                await setDoc(docRef, { isShopOpen: true });
                setIsShopOpen(true);
            }
        } catch (error) {
            console.error("Error fetching shop status:", error);
            setIsShopOpen(true);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchShopStatus();
    }, [fetchOrders, fetchShopStatus]);

    useEffect(() => {
        if (isEditModalOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isEditModalOpen, selectedOrder]);

    const toggleShopStatus = async () => {
        setIsTogglingShop(true);
        try {
            const newState = !isShopOpen;
            const docRef = doc(db, 'dollOrders', 'store_config');
            await setDoc(docRef, { isShopOpen: newState }, { merge: true });
            setIsShopOpen(newState);
        } catch (error) {
            console.error("Error toggling shop status:", error);
            setInfoModalState({ title: '操作失敗', message: '切換狀態失敗：可能是權限不足或網路問題。' });
        } finally {
            setIsTogglingShop(false);
        }
    };
    
    const handleBatchSync = async () => {
        const syncAction = async () => {
            setIsSyncing(true);
            setSyncProgress(`(0/${orders.length})`);
            let successCount = 0;
            let errorCount = 0;
            const sortedOrders = [...orders].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

            for (let i = 0; i < sortedOrders.length; i++) {
                const order = sortedOrders[i];
                try {
                    await syncOrderToGoogleSheet(order);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to sync order ${order.orderId}:`, error);
                    errorCount++;
                }
                setSyncProgress(`(${i + 1}/${sortedOrders.length})`);
            }

            setIsSyncing(false);
            setSyncProgress('');

            setInfoModalState({
                title: '同步完成！',
                message: (
                    <div>
                        <p>成功: {successCount} 筆</p>
                        <p>失敗: {errorCount} 筆</p>
                        <p className="text-sm mt-2">詳情請查看瀏覽器開發者主控台。</p>
                    </div>
                )
            });
        };

        setConfirmModalState({
            title: '確認同步',
            message: `確定要將全部 ${orders.length} 筆訂單同步到 Google Sheets 嗎？\n\n- 這將會逐筆新增或更新 Sheet 中的資料。\n- 如果訂單數量龐大，可能需要一些時間。`,
            onConfirm: syncAction,
            confirmText: '開始同步'
        });
    };

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOrderIds(e.target.checked ? new Set(orders.map(o => o.id)) : new Set());
    };

    const toggleSelectOrder = (id: string) => {
        const newSet = new Set(selectedOrderIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedOrderIds(newSet);
    };

    const deleteOrderImages = async (order: DollOrder) => {
        const urls = [...(order.referenceImageUrls || []), ...(order.progressImageUrls || [])];
        const deletePromises = urls.map(url => {
            try {
                return deleteObject(ref(storage, url)).catch(err => console.warn("Image delete failed:", err));
            } catch (e) {
                console.warn(e);
                return Promise.resolve();
            }
        });
        await Promise.all(deletePromises);
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
                const order = orders.find(o => o.id === id);
                if (order) {
                    await deleteOrderImages(order);
                    batch.delete(doc(db, 'dollOrders', id));
                }
            }
            
            await batch.commit();
            setInfoModalState({ title: '成功', message: `成功刪除 ${idsToDelete.length} 筆訂單。` });
            await fetchOrders();
            setIsBatchDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Batch delete error:", error);
            setInfoModalState({ title: '批次刪除失敗', message: error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const openCleanupModal = () => {
        const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - sixtyDaysMs;
        const candidates = orders.filter(order => 
            (order.status === OrderStatus.DELIVERED || order.status === '已送達(委託完成)' as any) && 
            order.createdAt.toMillis() < cutoffTime
        );

        if (candidates.length === 0) {
            setIsNoOldOrdersModalOpen(true);
            return;
        }
        setCleanupCandidates(candidates);
        setSelectedCleanupIds(new Set(candidates.map(o => o.id)));
        setIsCleanupModalOpen(true);
    };

    const toggleCleanupSelection = (id: string) => {
        setSelectedCleanupIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
            return newSet;
        });
    };

    const executeBatchCleanup = async () => {
        if (selectedCleanupIds.size === 0) {
            setInfoModalState({ title: '提示', message: '未選擇任何訂單。' });
            return;
        }
        
        const cleanupAction = async () => {
            setIsUpdating(true);
            try {
                const batch = writeBatch(db);
                for (const id of selectedCleanupIds) {
                    const order = cleanupCandidates.find(o => o.id === id);
                    if (order) {
                        await deleteOrderImages(order);
                        batch.delete(doc(db, 'dollOrders', id));
                    }
                }
                await batch.commit();
                setInfoModalState({ title: '成功', message: `已成功清除 ${selectedCleanupIds.size} 筆舊訂單及其圖片。` });
                await fetchOrders();
                setIsCleanupModalOpen(false);
            } catch (error: any) {
                console.error("Error cleaning up orders:", error);
                setInfoModalState({ title: '清除失敗', message: error.message });
            } finally {
                setIsUpdating(false);
            }
        };

        setConfirmModalState({
            title: '確認清除',
            message: `確定要永久刪除這 ${selectedCleanupIds.size} 筆訂單嗎？\n這將同時刪除所有相關圖片！此動作無法復原。`,
            onConfirm: cleanupAction,
            confirmText: '確認清除'
        });
    };

    const openEditModal = (order: DollOrder) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setEditingPrice(order.totalPrice);
        setEditingRemarks(order.remarks);
        setAdminMessageInput('');
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedOrder(null);
        setNewImage(null);
        setNewStatus(null);
        setEditingPrice('');
        setEditingRemarks('');
        setAdminMessageInput('');
    };

    const openNewOrderModal = () => setIsNewOrderModalOpen(true);
    const closeNewOrderModal = () => {
        setIsNewOrderModalOpen(false);
        setNewOrderNickname('');
        setNewOrderTitle('');
        setNewOrderPrice('');
        setNewOrderHeadpieceCraft(HeadpieceCraft.INTEGRATED);
        setNewOrderImages(null);
        setNewOrderRemarks('');
        setNewOrderAddons(new Set());
    };

    const handleCreateOrder = async () => {
        if (!newOrderNickname || !newOrderTitle || !newOrderImages || newOrderPrice === '') {
            setInfoModalState({ title: '資料不完整', message: '請填寫暱稱、委託標題、總金額並上傳說明圖！' });
            return;
        }
        setIsUpdating(true);
        try {
            // Fix: Explicitly type `file` as `File` to resolve a TypeScript error where it was incorrectly inferred as `unknown`.
            const uploadPromises = Array.from(newOrderImages).map((file: File) => uploadAndCompressImage(file, 'doll-references', 'reference'));
            const imageUrls = await Promise.all(uploadPromises);
            const newOrderData = {
                orderId: `NOCY-${Date.now().toString().slice(-6)}`,
                nickname: newOrderNickname, title: newOrderTitle,
                totalPrice: Number(newOrderPrice), status: OrderStatus.ACCEPTED,
                headpieceCraft: newOrderHeadpieceCraft, referenceImageUrls: imageUrls,
                remarks: newOrderRemarks || '由管理員手動建立',
                addons: DOLL_ADDONS.filter(addon => newOrderAddons.has(addon.id)),
                messages: [], progressImageUrls: [], createdAt: Timestamp.now(),
            };
            await addDoc(collection(db, 'dollOrders'), newOrderData);
            await syncOrderToGoogleSheet(newOrderData as any);
            await fetchOrders();
            closeNewOrderModal();
        } catch (error) {
            console.error("Error creating order:", error);
            setInfoModalState({ title: '新增訂單失敗', message: error instanceof Error ? error.message : String(error) });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendAdminMessage = async () => {
        if (!selectedOrder || !adminMessageInput.trim()) return;
        setIsSendingMessage(true);
        try {
            const newMessage = { text: adminMessageInput.trim(), sender: 'admin' as const, timestamp: Timestamp.now() };
            await updateDoc(doc(db, 'dollOrders', selectedOrder.id), { messages: arrayUnion(newMessage) });
            const updatedOrder = { ...selectedOrder, messages: [...(selectedOrder.messages || []), newMessage] as any };
            setSelectedOrder(updatedOrder);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
            setAdminMessageInput('');
        } catch (error) {
            console.error("Error sending message:", error);
            setInfoModalState({ title: '錯誤', message: '訊息發送失敗' });
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleUpdateOrder = async () => {
        if (!selectedOrder) return;
        setIsUpdating(true);
        try {
            const updates: any = {};
            if (newStatus && newStatus !== selectedOrder.status) updates.status = newStatus;
            if (editingPrice !== '' && Number(editingPrice) !== selectedOrder.totalPrice) updates.totalPrice = Number(editingPrice);
            if (editingRemarks !== selectedOrder.remarks) updates.remarks = editingRemarks;
            
            if (newImage) {
                updates.progressImageUrls = arrayUnion(await uploadAndCompressImage(newImage, 'progress-images', 'progress'));
            }

            if (Object.keys(updates).length > 0) {
                 await updateDoc(doc(db, 'dollOrders', selectedOrder.id), updates);
                 if (updates.status || updates.totalPrice || updates.remarks) {
                     await syncOrderToGoogleSheet({ ...selectedOrder, ...updates });
                 }
            }
            await fetchOrders();
            closeEditModal();
        } catch (error) {
            console.error("Error updating order:", error);
            setInfoModalState({ title: '更新失敗', message: error instanceof Error ? error.message : String(error) });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleAddonToggle = (addonId: string) => {
        setNewOrderAddons(prev => {
            const newSet = new Set(prev);
            if (newSet.has(addonId)) newSet.delete(addonId); else newSet.add(addonId);
            return newSet;
        });
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                     <Link to="/admin" className="text-siam-blue hover:text-siam-dark transition-colors mb-2 inline-flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        <span>返回管理選單</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-siam-dark">你好，小餅暹羅</h1>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                    {selectedOrderIds.size > 0 && (
                        <button 
                            onClick={openBatchDeleteModal}
                            className="bg-red-600 text-white py-2 px-4 rounded-lg shadow-sm hover:bg-red-700 transition-all flex items-center gap-2 animate-bounce-in"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            刪除選取 ({selectedOrderIds.size})
                        </button>
                    )}
                     <button 
                        onClick={openCleanupModal}
                        className="bg-white text-siam-brown py-2 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 border border-siam-brown/30"
                        title="清除所有已送達且超過60天的訂單"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        清除舊單
                    </button>
                    <button
                        onClick={handleBatchSync}
                        disabled={isSyncing || isLoading || orders.length === 0}
                        className="bg-white text-green-700 py-2 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 border border-green-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="將所有訂單資料同步到 Google Sheet"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                        {isSyncing ? `同步中... ${syncProgress}` : '同步'}
                    </button>
                    <button 
                        onClick={toggleShopStatus} 
                        disabled={isTogglingShop}
                        className={`py-2 px-6 rounded-lg shadow-md font-bold transition-all flex items-center gap-2 ${isShopOpen ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
                    >
                        {isTogglingShop ? <LoadingSpinner /> : isShopOpen ? '營業中' : '歇業中'}
                    </button>
                    <button onClick={openNewOrderModal} className="bg-siam-blue text-siam-cream py-2 px-4 rounded-lg shadow-md hover:bg-siam-dark transition-all whitespace-nowrap">
                        新增訂單
                    </button>
                </div>
            </div>

            <div className="bg-white/50 p-6 rounded-lg shadow-md">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center"><LoadingSpinner /><p className="mt-4 text-siam-dark font-semibold">正在讀取訂單資料...</p></div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-siam-blue">
                        <thead className="bg-siam-blue/10">
                            <tr>
                                <th className="px-4 py-3 w-10"><input type="checkbox" className="h-4 w-4 text-siam-blue rounded border-gray-300 focus:ring-siam-blue cursor-pointer" checked={selectedOrderIds.size === orders.length && orders.length > 0} onChange={toggleSelectAll} /></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-siam-dark uppercase tracking-wider">訂單編號</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-siam-dark uppercase tracking-wider">暱稱</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-siam-dark uppercase tracking-wider">標題</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-siam-dark uppercase tracking-wider">金額</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-siam-dark uppercase tracking-wider">狀態</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-siam-dark uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map(order => (
                                <tr key={order.id} className={selectedOrderIds.has(order.id) ? 'bg-blue-50' : ''}>
                                    <td className="px-4 py-4 w-10"><input type="checkbox" className="h-4 w-4 text-siam-blue rounded border-gray-300 focus:ring-siam-blue cursor-pointer" checked={selectedOrderIds.has(order.id)} onChange={() => toggleSelectOrder(order.id)} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-siam-brown">{order.orderId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-siam-dark">{order.nickname}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-siam-brown">{order.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-siam-brown">NT$ {order.totalPrice}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{order.status === '已送達(委託完成)' ? '已送達' : order.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onClick={() => openEditModal(order)} className="text-siam-blue hover:text-siam-dark font-bold">查看/編輯</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
            
            <Modal isOpen={isBatchDeleteModalOpen} onClose={() => setIsBatchDeleteModalOpen(false)} title="⚠️ 批次刪除確認">
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                        <p className="font-bold text-lg mb-2">嚴重警告：此動作無法復原！</p>
                        <p>您即將永久刪除 <span className="font-bold text-xl">{selectedOrderIds.size}</span> 筆訂單。</p>
                        <ul className="list-disc list-inside mt-2 text-sm"><li>所有選取的訂單資料將被永久移除。</li><li>所有相關的參考圖、進度圖將從資料庫中刪除。</li></ul>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">請輸入「確認刪除」以執行此操作：</label>
                        <input type="text" value={batchDeleteInput} onChange={(e) => setBatchDeleteInput(e.target.value)} placeholder="確認刪除" className="w-full p-2 border border-red-300 rounded focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-300" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={() => setIsBatchDeleteModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">取消</button>
                        <button onClick={executeBatchDelete} disabled={batchDeleteInput !== '確認刪除' || isUpdating} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">{isUpdating ? <LoadingSpinner /> : '確認刪除'}</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isNoOldOrdersModalOpen} onClose={() => setIsNoOldOrdersModalOpen(false)} title="清除舊訂單">
                 <div className="flex flex-col items-center justify-center p-4 space-y-4">
                    <div className="bg-green-100 p-4 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <p className="text-lg font-bold text-siam-dark">目前沒有舊訂單</p>
                    <p className="text-siam-brown text-center">系統中沒有「已送達」且建立時間超過 60 天的訂單。</p>
                    <button onClick={() => setIsNoOldOrdersModalOpen(false)} className="px-6 py-2 bg-siam-blue text-white rounded hover:bg-siam-dark">好的</button>
                 </div>
            </Modal>

            <Modal isOpen={isCleanupModalOpen} onClose={() => setIsCleanupModalOpen(false)} title="清除舊訂單 (送達 > 60天)">
                <div className="space-y-4 flex flex-col max-h-[70vh]">
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800 text-sm"><p>請勾選您要<b>刪除</b>的訂單。未勾選的訂單將會被保留。</p><p className="font-bold mt-1">注意：刪除後無法復原！相關圖片也會一併刪除。</p></div>
                    <div className="flex-grow overflow-y-auto border border-gray-200 rounded p-2 bg-white space-y-2">
                        {cleanupCandidates.map(order => (
                            <label key={order.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-100 last:border-0">
                                <input type="checkbox" checked={selectedCleanupIds.has(order.id)} onChange={() => toggleCleanupSelection(order.id)} className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                                <div className="text-sm"><p className="font-bold text-gray-800">{order.nickname} - {order.title}</p><p className="text-gray-500 text-xs font-mono">{order.orderId} | {new Date(order.createdAt.toMillis()).toLocaleDateString()}</p></div>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-sm text-gray-500">已選 {selectedCleanupIds.size} / {cleanupCandidates.length} 筆</div>
                        <div className="flex space-x-3">
                            <button onClick={() => setIsCleanupModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">取消</button>
                            <button onClick={executeBatchCleanup} disabled={selectedCleanupIds.size === 0 || isUpdating} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">{isUpdating ? <LoadingSpinner /> : '確認清除'}</button>
                        </div>
                    </div>
                </div>
            </Modal>

            {selectedOrder && (<Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`管理訂單: ${selectedOrder.nickname} - ${selectedOrder.orderId}`} maxWidth="max-w-6xl">
                {/* ... existing modal content ... */}
                 {/* Re-implementing modal content for context in update */}
                 <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
                     {/* Left: Edit Form */}
                    <div className="md:w-1/2 space-y-4 overflow-y-auto pr-2">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-bold text-gray-700">訂單狀態</label>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedOrder.status === '已送達(委託完成)' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{selectedOrder.status}</span>
                            </div>
                            <select 
                                value={newStatus || ''} 
                                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                                className="w-full p-2 border rounded bg-white"
                            >
                                {OrderStatusArray.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">委託明細 (唯讀)</label>
                            <div className="p-3 bg-gray-50 rounded border text-sm space-y-2">
                                <p><span className="font-bold">暱稱:</span> {selectedOrder.nickname}</p>
                                <p><span className="font-bold">標題:</span> {selectedOrder.title}</p>
                                <p><span className="font-bold">頭飾:</span> {selectedOrder.headpieceCraft}</p>
                                <p><span className="font-bold">加購:</span> {selectedOrder.addons && selectedOrder.addons.length > 0 ? selectedOrder.addons.map(a => a.name).join(', ') : '無'}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">總金額</label>
                            <input type="number" value={editingPrice} onChange={(e) => setEditingPrice(Number(e.target.value))} className="w-full p-2 border rounded" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">訂單備註</label>
                            <textarea value={editingRemarks} onChange={(e) => setEditingRemarks(e.target.value)} className="w-full p-2 border rounded" rows={3} />
                        </div>
                        
                        <div className="border-t pt-4">
                            <h4 className="font-bold text-gray-700 mb-2">上傳進度圖</h4>
                            <div className="flex gap-2">
                                <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files ? e.target.files[0] : null)} className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:bg-siam-blue file:text-white" />
                            </div>
                            {selectedOrder.progressImageUrls && selectedOrder.progressImageUrls.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {selectedOrder.progressImageUrls.map((url, idx) => (
                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"><img src={url} className="w-full h-16 object-cover rounded border" /></a>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button onClick={handleUpdateOrder} disabled={isUpdating} className="w-full bg-siam-blue text-white py-2 rounded font-bold shadow hover:bg-siam-dark">{isUpdating ? <LoadingSpinner /> : '儲存變更'}</button>
                        </div>
                    </div>

                    {/* Right: Message Board */}
                    <div className="md:w-1/2 flex flex-col h-full border-l pl-4 border-gray-200">
                        <h3 className="font-bold text-siam-dark mb-2">即時對話 / 備註</h3>
                        <div className="flex-grow bg-gray-50 rounded-lg p-3 overflow-y-auto mb-3 space-y-3 shadow-inner" ref={messagesEndRef}>
                            {/* Merge legacy adminNotes with new messages */}
                            {[
                                ...(selectedOrder.adminNotes || []).map(note => ({ text: note.text, sender: 'admin' as const, timestamp: note.timestamp })),
                                ...(selectedOrder.messages || [])
                            ].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()).map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-2 max-w-[85%] rounded-lg text-sm shadow-sm ${msg.sender === 'admin' ? 'bg-siam-blue text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}`}>
                                        <p className="text-xs opacity-75 mb-1">{msg.sender === 'admin' ? '管理員' : '客戶'} - {new Date(msg.timestamp.toMillis()).toLocaleString()}</p>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {(!selectedOrder.messages?.length && !selectedOrder.adminNotes?.length) && <p className="text-center text-gray-400 text-sm mt-10">尚無對話紀錄</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <input 
                                type="text" 
                                value={adminMessageInput} 
                                onChange={(e) => setAdminMessageInput(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleSendAdminMessage()}
                                placeholder="輸入訊息..." 
                                className="flex-grow p-2 border rounded text-sm focus:ring-2 focus:ring-siam-blue outline-none"
                            />
                            <button onClick={handleSendAdminMessage} disabled={isSendingMessage || !adminMessageInput.trim()} className="bg-siam-brown text-white px-4 py-2 rounded text-sm whitespace-nowrap font-bold hover:bg-siam-dark transition-colors">發送</button>
                        </div>
                    </div>
                 </div>
            </Modal>)}

            <Modal isOpen={isNewOrderModalOpen} onClose={closeNewOrderModal} title="新增訂單">{/* ... existing modal content ... */}</Modal>

            {/* Info Modal to replace alert() */}
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

            {/* Confirmation Modal to replace confirm() */}
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

export default AdminDollsDashboardPage;