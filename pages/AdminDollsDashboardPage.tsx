
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
    
    // Edit Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<DollOrder | null>(null);
    const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);
    const [newImage, setNewImage] = useState<File | null>(null);
    const [editingPrice, setEditingPrice] = useState<number | ''>('');
    const [editingRemarks, setEditingRemarks] = useState('');
    
    // Chat state in Admin
    const [adminMessageInput, setAdminMessageInput] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // New Order Modal state
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [newOrderNickname, setNewOrderNickname] = useState('');
    const [newOrderTitle, setNewOrderTitle] = useState('');
    const [newOrderPrice, setNewOrderPrice] = useState<number | ''>('');
    const [newOrderHeadpieceCraft, setNewOrderHeadpieceCraft] = useState<HeadpieceCraft>(HeadpieceCraft.INTEGRATED);
    const [newOrderImages, setNewOrderImages] = useState<FileList | null>(null);
    const [newOrderRemarks, setNewOrderRemarks] = useState('');
    const [newOrderAddons, setNewOrderAddons] = useState<Set<string>>(new Set());

    // Delete Confirmation Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<DollOrder | null>(null);
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

    // Batch Cleanup Modal state
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [isNoOldOrdersModalOpen, setIsNoOldOrdersModalOpen] = useState(false);
    const [cleanupCandidates, setCleanupCandidates] = useState<DollOrder[]>([]);
    const [selectedCleanupIds, setSelectedCleanupIds] = useState<Set<string>>(new Set());

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'dollOrders'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedOrders = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as DollOrder))
                .filter(doc => doc.id !== 'store_config');
            setOrders(fetchedOrders);
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
                try {
                    await setDoc(docRef, { isShopOpen: true });
                } catch (e) {
                    console.warn("Could not init store config, using default", e);
                }
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

    // Scroll to bottom of chat when messages change or modal opens
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
            alert("切換狀態失敗：可能是權限不足或網路問題。");
        } finally {
            setIsTogglingShop(false);
        }
    };

    const deleteOrderImages = async (order: DollOrder) => {
        const deletePromises: Promise<void>[] = [];
        if (order.referenceImageUrls && order.referenceImageUrls.length > 0) {
            order.referenceImageUrls.forEach(url => {
                try {
                    const imageRef = ref(storage, url);
                    deletePromises.push(deleteObject(imageRef).catch(err => console.warn(err)));
                } catch (e) { console.warn(e); }
            });
        }
        if (order.progressImageUrls && order.progressImageUrls.length > 0) {
            order.progressImageUrls.forEach(url => {
                try {
                    const imageRef = ref(storage, url);
                    deletePromises.push(deleteObject(imageRef).catch(err => console.warn(err)));
                } catch (e) { console.warn(e); }
            });
        }
        await Promise.all(deletePromises);
    };

    const confirmDeleteOrder = (order: DollOrder) => {
        setOrderToDelete(order);
        setDeleteConfirmationInput('');
        setIsDeleteModalOpen(true);
    };

    const executeDeleteOrder = async () => {
        if (!orderToDelete) return;
        if (deleteConfirmationInput !== orderToDelete.orderId) {
            alert("訂單編號輸入不正確，無法刪除。");
            return;
        }
        setIsUpdating(true);
        try {
            await deleteOrderImages(orderToDelete);
            await deleteDoc(doc(db, 'dollOrders', orderToDelete.id));
            alert(`訂單 ${orderToDelete.orderId} (含相關圖片) 已刪除`);
            await fetchOrders();
            setIsDeleteModalOpen(false);
            setOrderToDelete(null);
        } catch (error: any) {
            console.error("Error deleting order:", error);
            alert(`刪除失敗: ${error.message || "未知錯誤"}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const openCleanupModal = () => {
        const now = Date.now();
        const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
        const cutoffTime = now - sixtyDaysMs;
        const candidates = orders.filter(order => {
            const isDelivered = order.status === OrderStatus.DELIVERED || order.status === '已送達(委託完成)' as any;
            const isOld = order.createdAt.toMillis() < cutoffTime;
            return isDelivered && isOld;
        });

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
            alert("未選擇任何訂單");
            return;
        }
        if (!window.confirm(`確定要永久刪除這 ${selectedCleanupIds.size} 筆訂單嗎？\n這將同時刪除所有相關圖片！`)) {
            return;
        }
        setIsUpdating(true);
        try {
            const batch = writeBatch(db);
            const imageDeletionPromises: Promise<void>[] = [];
            selectedCleanupIds.forEach(id => {
                const order = cleanupCandidates.find(o => o.id === id);
                if (order) {
                    imageDeletionPromises.push(deleteOrderImages(order));
                    const docRef = doc(db, 'dollOrders', id);
                    batch.delete(docRef);
                }
            });
            await Promise.all(imageDeletionPromises);
            await batch.commit();
            alert(`已成功清除 ${selectedCleanupIds.size} 筆舊訂單及其圖片。`);
            await fetchOrders();
            setIsCleanupModalOpen(false);
        } catch (error: any) {
            console.error("Error cleaning up orders:", error);
            alert(`清除失敗: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Edit Modal Functions ---
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
            alert('請填寫暱稱、委託標題、總金額並上傳說明圖！');
            return;
        }
        setIsUpdating(true);
        try {
            const uploadPromises = Array.from(newOrderImages).map((file: File) =>
                uploadAndCompressImage(file, 'doll-references', 'reference')
            );
            const imageUrls = await Promise.all(uploadPromises);

            const shortOrderId = `NOCY-${Date.now().toString().slice(-6)}`;
            const newOrderData = {
                orderId: shortOrderId,
                nickname: newOrderNickname,
                title: newOrderTitle,
                totalPrice: Number(newOrderPrice),
                status: OrderStatus.ACCEPTED,
                headpieceCraft: newOrderHeadpieceCraft,
                referenceImageUrls: imageUrls,
                remarks: newOrderRemarks || '由管理員手動建立',
                addons: DOLL_ADDONS.filter(addon => newOrderAddons.has(addon.id)),
                adminNotes: [],
                messages: [],
                progressImageUrls: [],
                createdAt: Timestamp.now(),
            };
            
            // Add to Firebase
            await addDoc(collection(db, 'dollOrders'), newOrderData);
            
            // Sync to Google Sheets
            await syncOrderToGoogleSheet(newOrderData as any);

            await fetchOrders();
            closeNewOrderModal();
        } catch (error) {
            console.error("Error creating order:", error);
            alert("新增訂單失敗！");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendAdminMessage = async () => {
        if (!selectedOrder || !adminMessageInput.trim()) return;
        setIsSendingMessage(true);
        try {
            const orderRef = doc(db, 'dollOrders', selectedOrder.id);
            const newMessage = {
                text: adminMessageInput.trim(),
                sender: 'admin',
                timestamp: Timestamp.now(),
            };
            await updateDoc(orderRef, {
                messages: arrayUnion(newMessage)
            });

            // Optimistic update for UI
            const updatedOrder = {
                ...selectedOrder,
                messages: [...(selectedOrder.messages || []), newMessage] as any
            };
            setSelectedOrder(updatedOrder);
            
            // Also update main list silently
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
            
            setAdminMessageInput('');
        } catch (error) {
            console.error("Error sending message:", error);
            alert("訊息發送失敗");
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleUpdateOrder = async () => {
        if (!selectedOrder) return;
        setIsUpdating(true);
        try {
            const orderRef = doc(db, 'dollOrders', selectedOrder.id);
            const updates: any = {};
            if (newStatus && newStatus !== selectedOrder.status) {
                updates.status = newStatus;
            }
            if (editingPrice !== '' && Number(editingPrice) !== selectedOrder.totalPrice) {
                updates.totalPrice = Number(editingPrice);
            }
            if (editingRemarks !== selectedOrder.remarks) {
                updates.remarks = editingRemarks;
            }
            
            if (newImage) {
                const downloadURL = await uploadAndCompressImage(newImage, 'progress-images', 'progress');
                updates.progressImageUrls = arrayUnion(downloadURL);
            }

            if (Object.keys(updates).length > 0) {
                 await updateDoc(orderRef, updates);
                 
                 // Sync with Google Sheets if relevant fields changed
                 if (updates.status || updates.totalPrice || updates.remarks) {
                     const updatedOrderData = {
                         ...selectedOrder,
                         ...updates
                     };
                     await syncOrderToGoogleSheet(updatedOrderData);
                 }
            }
            await fetchOrders();
            closeEditModal();
        } catch (error) {
            console.error("Error updating order:", error);
            alert("更新失敗！");
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
                     <button 
                        onClick={openCleanupModal}
                        className="bg-red-100 text-red-700 py-2 px-4 rounded-lg shadow-sm hover:bg-red-200 transition-all flex items-center gap-2 border border-red-300"
                        title="清除所有已送達且超過60天的訂單"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        清除舊訂單
                    </button>
                    <button 
                        onClick={toggleShopStatus} 
                        disabled={isTogglingShop}
                        className={`py-2 px-6 rounded-lg shadow-md font-bold transition-all flex items-center gap-2 ${
                            isShopOpen 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                    >
                        {isTogglingShop ? <LoadingSpinner /> : (
                            <>
                                {isShopOpen ? (
                                    <><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> 營業中</>
                                ) : (
                                    <><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> 歇業中</>
                                )}
                            </>
                        )}
                    </button>
                    <button onClick={openNewOrderModal} className="bg-siam-blue text-siam-cream py-2 px-4 rounded-lg shadow-md hover:bg-siam-dark transition-all whitespace-nowrap">
                        新增訂單
                    </button>
                </div>
            </div>

            <div className="bg-white/50 p-6 rounded-lg shadow-md">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-siam-dark font-semibold">正在讀取訂單資料...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-siam-blue">
                        <thead className="bg-siam-blue/10">
                            <tr>
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
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-siam-brown">{order.orderId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-siam-dark">{order.nickname}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-siam-brown">{order.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-siam-brown">NT$ {order.totalPrice}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {order.status === '已送達(委託完成)' ? '已送達' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => openEditModal(order)} className="text-siam-blue hover:text-siam-dark font-bold">查看/編輯</button>
                                            <button 
                                                onClick={() => confirmDeleteOrder(order)} 
                                                className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                                                title="刪除訂單"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
            
            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="⚠️ 刪除訂單確認">
                {orderToDelete && (
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                            <p className="font-bold">此動作無法復原！</p>
                            <p>您確定要永久刪除訂單 <span className="font-mono bg-white px-1 rounded">{orderToDelete.orderId}</span> ({orderToDelete.nickname}) 嗎？</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">請輸入訂單編號以確認刪除：</label>
                            <input 
                                type="text" 
                                value={deleteConfirmationInput}
                                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                                placeholder={orderToDelete.orderId}
                                className="w-full p-2 border border-red-300 rounded focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                             <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">取消</button>
                             <button 
                                onClick={executeDeleteOrder}
                                disabled={deleteConfirmationInput !== orderToDelete.orderId || isUpdating}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                             >
                                {isUpdating ? <LoadingSpinner /> : '確認刪除'}
                             </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* No Old Orders Modal */}
            <Modal isOpen={isNoOldOrdersModalOpen} onClose={() => setIsNoOldOrdersModalOpen(false)} title="清除舊訂單">
                 <div className="flex flex-col items-center justify-center p-4 space-y-4">
                    <div className="bg-green-100 p-4 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-lg font-bold text-siam-dark">目前沒有舊訂單</p>
                    <p className="text-siam-brown text-center">系統中沒有「已送達」且建立時間超過 60 天的訂單。</p>
                    <button onClick={() => setIsNoOldOrdersModalOpen(false)} className="px-6 py-2 bg-siam-blue text-white rounded hover:bg-siam-dark">
                        好的
                    </button>
                 </div>
            </Modal>

            {/* Batch Cleanup Modal */}
            <Modal isOpen={isCleanupModalOpen} onClose={() => setIsCleanupModalOpen(false)} title="清除舊訂單 (送達 > 60天)">
                <div className="space-y-4 flex flex-col max-h-[70vh]">
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800 text-sm">
                        <p>請勾選您要<b>刪除</b>的訂單。未勾選的訂單將會被保留。</p>
                        <p className="font-bold mt-1">注意：刪除後無法復原！相關圖片也會一併刪除。</p>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto border border-gray-200 rounded p-2 bg-white space-y-2">
                        {cleanupCandidates.map(order => (
                            <label key={order.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-100 last:border-0">
                                <input 
                                    type="checkbox" 
                                    checked={selectedCleanupIds.has(order.id)}
                                    onChange={() => toggleCleanupSelection(order.id)}
                                    className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <div className="text-sm">
                                    <p className="font-bold text-gray-800">{order.nickname} - {order.title}</p>
                                    <p className="text-gray-500 text-xs font-mono">{order.orderId} | {new Date(order.createdAt.toMillis()).toLocaleDateString()}</p>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-sm text-gray-500">
                            已選 {selectedCleanupIds.size} / {cleanupCandidates.length} 筆
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => setIsCleanupModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">取消</button>
                            <button 
                                onClick={executeBatchCleanup}
                                disabled={selectedCleanupIds.size === 0 || isUpdating}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                            >
                                {isUpdating ? <LoadingSpinner /> : '確認清除'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Edit/View Order Modal */}
            {selectedOrder && (
                <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`管理訂單: ${selectedOrder.orderId}`} maxWidth="max-w-6xl">
                    <div className="flex flex-col lg:flex-row gap-6 h-full lg:h-[70vh]">
                        {/* Left Column: Details & Edit Fields */}
                        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
                            {/* Order Details (Read-onlyish) */}
                            <div className="bg-gray-100 p-4 rounded-md space-y-4">
                                <h3 className="font-bold text-siam-dark border-b border-gray-300 pb-2">委託內容詳情</h3>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <p className="text-sm font-bold text-gray-500">頭飾工藝</p>
                                        <p className="text-siam-dark">{selectedOrder.headpieceCraft}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-500">加價購項目</p>
                                        {selectedOrder.addons && selectedOrder.addons.length > 0 ? (
                                            <p className="text-siam-dark text-sm">{selectedOrder.addons.map(a => a.name).join(', ')}</p>
                                        ) : <span className="text-sm text-gray-400">無</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-500">參考圖 (點擊開啟大圖)</p>
                                    <div className="flex gap-2 overflow-x-auto py-2">
                                        {selectedOrder.referenceImageUrls && selectedOrder.referenceImageUrls.length > 0 ? (
                                            selectedOrder.referenceImageUrls.map((url, idx) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                                    <img src={url} alt={`Ref ${idx}`} className="w-20 h-20 object-cover rounded shadow-sm hover:opacity-80 transition-opacity" />
                                                </a>
                                            ))
                                        ) : <span className="text-sm text-gray-400">無參考圖</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex-grow">
                                <h3 className="font-bold text-siam-dark border-b border-siam-blue/30 pb-2">編輯內容</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-siam-dark">訂單狀態</label>
                                        <select value={newStatus || ''} onChange={(e) => setNewStatus(e.target.value as OrderStatus)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-siam-dark focus:border-siam-dark sm:text-sm rounded-md bg-white">
                                            {OrderStatusArray.map(status => <option key={status} value={status}>{status}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-siam-dark">總金額 (NT$)</label>
                                        <input type="number" value={editingPrice} onChange={(e) => setEditingPrice(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-siam-dark focus:border-siam-dark"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-siam-dark">編輯委託備註 (客戶可見)</label>
                                    <textarea rows={3} value={editingRemarks} onChange={(e) => setEditingRemarks(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-siam-dark focus:border-siam-dark"></textarea>
                                </div>
                                <div className="bg-siam-blue/5 p-3 rounded-md border border-siam-blue/20">
                                    <label className="block text-sm font-bold text-siam-blue">上傳新進度圖片</label>
                                    <input type="file" onChange={(e) => setNewImage(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-sm text-siam-brown file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-siam-blue file:text-siam-cream hover:file:bg-siam-dark"/>
                                </div>
                                
                                <div className="flex justify-end pt-2">
                                    <button onClick={handleUpdateOrder} disabled={isUpdating} className="w-full sm:w-auto py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-siam-blue hover:bg-siam-dark disabled:bg-gray-400 flex items-center justify-center">
                                        {isUpdating ? <LoadingSpinner /> : '確認更新訂單資訊'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Chat / Messages */}
                        <div className="flex-1 flex flex-col h-[500px] lg:h-auto border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-4">
                            <h3 className="font-bold text-siam-dark border-b border-siam-blue/30 pb-2 mb-2 flex justify-between items-center">
                                <span>留言板 / 對話紀錄</span>
                                <span className="text-xs text-gray-500 font-normal">與客戶即時溝通</span>
                            </h3>
                            
                            <div className="flex-grow overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200">
                                {(() => {
                                    const allMessages = [
                                        ...(selectedOrder.adminNotes || []).map(note => ({
                                            text: note.text,
                                            sender: 'admin' as const,
                                            timestamp: note.timestamp
                                        })),
                                        ...(selectedOrder.messages || [])
                                    ].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

                                    if (allMessages.length === 0) {
                                        return (
                                            <div className="text-center text-gray-400 mt-10 text-sm">
                                                尚無對話紀錄
                                            </div>
                                        );
                                    }

                                    return allMessages.map((msg, index) => {
                                        const isAdmin = msg.sender === 'admin';
                                        return (
                                            <div key={`msg-${index}`} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`p-2 max-w-[90%] shadow-sm text-sm ${
                                                    isAdmin 
                                                        ? 'bg-siam-blue text-white rounded-l-xl rounded-tr-xl' 
                                                        : 'bg-white border border-gray-200 text-siam-dark rounded-r-xl rounded-tl-xl'
                                                }`}>
                                                    <p className="text-xs opacity-75 mb-1 flex justify-between gap-2">
                                                        <span>{isAdmin ? '我 (掌櫃)' : `客戶 (${selectedOrder.nickname})`}</span>
                                                        <span>{new Date(msg.timestamp.toMillis()).toLocaleString()}</span>
                                                    </p>
                                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="mt-3 pt-2 border-t border-gray-200">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={adminMessageInput}
                                        onChange={(e) => setAdminMessageInput(e.target.value)}
                                        placeholder="輸入訊息回覆客戶..." 
                                        className="flex-grow p-2 border border-siam-blue/30 rounded-md focus:ring-2 focus:ring-siam-dark outline-none bg-white text-sm"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendAdminMessage();
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={handleSendAdminMessage}
                                        disabled={!adminMessageInput.trim() || isSendingMessage}
                                        className="bg-siam-brown text-siam-cream px-4 py-2 rounded-md hover:bg-siam-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm font-bold"
                                    >
                                        {isSendingMessage ? '...' : '發送'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">按下發送即時送出訊息，無需點擊更新訂單。</p>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* New Order Modal */}
            <Modal isOpen={isNewOrderModalOpen} onClose={closeNewOrderModal} title="新增訂單">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div>
                        <label className="block text-sm font-medium text-siam-dark">暱稱*</label>
                        <input type="text" value={newOrderNickname} onChange={(e) => setNewOrderNickname(e.target.value)} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-siam-dark focus:border-siam-dark"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-siam-dark">委託標題*</label>
                        <input type="text" value={newOrderTitle} onChange={(e) => setNewOrderTitle(e.target.value)} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-siam-dark focus:border-siam-dark"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-siam-dark">頭飾工藝*</label>
                        <select value={newOrderHeadpieceCraft} onChange={(e) => setNewOrderHeadpieceCraft(e.target.value as HeadpieceCraft)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-siam-dark focus:border-siam-dark sm:text-sm rounded-md bg-white">
                            {Object.values(HeadpieceCraft).map(craft => <option key={craft} value={craft}>{craft}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-siam-dark">說明圖* (最多5張)</label>
                        <input type="file" onChange={(e) => {
                            if (e.target.files && e.target.files.length > 5) {
                                alert('最多只能上傳 5 張圖片');
                                e.target.value = '';
                                setNewOrderImages(null);
                            } else {
                                setNewOrderImages(e.target.files);
                            }
                        }} multiple accept="image/*" required className="mt-1 block w-full text-sm text-siam-brown file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-siam-blue file:text-siam-cream hover:file:bg-siam-dark"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-siam-dark">加價購</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                            {DOLL_ADDONS.map(addon => (
                                <label key={addon.id} className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={newOrderAddons.has(addon.id)} onChange={() => handleAddonToggle(addon.id)} className="h-4 w-4 rounded border-gray-300 text-siam-blue focus:ring-siam-dark"/>
                                    <span className="text-sm">{addon.name} (+{addon.price}元)</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-siam-dark">總金額*</label>
                        <input type="number" value={newOrderPrice} onChange={(e) => setNewOrderPrice(e.target.value === '' ? '' : Number(e.target.value))} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-siam-dark focus:border-siam-dark"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-siam-dark">備註欄</label>
                        <textarea value={newOrderRemarks} onChange={(e) => setNewOrderRemarks(e.target.value)} rows={3} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-siam-dark focus:border-siam-dark"></textarea>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-4 pt-4 border-t border-gray-200">
                    <button onClick={closeNewOrderModal} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">取消</button>
                    <button onClick={handleCreateOrder} disabled={isUpdating} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-siam-blue hover:bg-siam-dark disabled:bg-gray-400 flex items-center">
                        {isUpdating ? <LoadingSpinner /> : '確認新增'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDollsDashboardPage;
