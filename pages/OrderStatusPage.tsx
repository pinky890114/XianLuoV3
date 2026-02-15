
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { DollOrder, BadgeOrder, DollOrderStatusArray, BadgeOrderStatusArray, OrderStatus } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import CareInstructions from '../components/CareInstructions';

// Union type for rendering
type CombinedOrder = (DollOrder | BadgeOrder) & { type: 'doll' | 'badge' };

const OrderStatusPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [orders, setOrders] = useState<CombinedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMsgId, setSendingMsgId] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) {
            setError('請輸入暱稱或訂單編號。');
            return;
        }
        setIsLoading(true);
        setError('');
        setOrders([]);
        setSearched(true);

        try {
            // 1. Search Doll Orders
            const dollOrdersRef = collection(db, 'dollOrders');
            const dQ1 = query(dollOrdersRef, where('nickname', '==', searchTerm));
            const dQ2 = query(dollOrdersRef, where('orderId', '==', searchTerm));
            
            // 2. Search Badge Orders
            const badgeOrdersRef = collection(db, 'badgeOrders');
            const bQ1 = query(badgeOrdersRef, where('nickname', '==', searchTerm));
            const bQ2 = query(badgeOrdersRef, where('orderId', '==', searchTerm));
            
            const [snapD1, snapD2, snapB1, snapB2] = await Promise.all([
                getDocs(dQ1), getDocs(dQ2), getDocs(bQ1), getDocs(bQ2)
            ]);
            
            const foundOrders = new Map<string, CombinedOrder>();
            
            const addOrder = (doc: any, type: 'doll' | 'badge') => {
                foundOrders.set(doc.id, { id: doc.id, ...doc.data(), type } as CombinedOrder);
            };

            snapD1.forEach(doc => addOrder(doc, 'doll'));
            snapD2.forEach(doc => addOrder(doc, 'doll'));
            snapB1.forEach(doc => addOrder(doc, 'badge'));
            snapB2.forEach(doc => addOrder(doc, 'badge'));

            const sortedOrders = Array.from(foundOrders.values()).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

            setOrders(sortedOrders);

        } catch (err) {
            console.error(err);
            setError('查詢訂單時發生錯誤。');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSendMessage = async (order: CombinedOrder, e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSendingMsgId(order.id);
        try {
            // Determine collection based on order type
            const collectionName = order.type === 'doll' ? 'dollOrders' : 'badgeOrders';
            const orderRef = doc(db, collectionName, order.id);
            
            const messageData = {
                text: newMessage.trim(),
                sender: 'customer',
                timestamp: Timestamp.now()
            };

            await updateDoc(orderRef, {
                messages: arrayUnion(messageData)
            });

            // Optimistically update UI
            setOrders(prevOrders => prevOrders.map(o => {
                if (o.id === order.id) {
                    return {
                        ...o,
                        messages: [...(o.messages || []), messageData] as any
                    };
                }
                return o;
            }));

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            alert("訊息發送失敗");
        } finally {
            setSendingMsgId(null);
        }
    };

    // Helper to normalize legacy status strings
    const normalizeStatus = (status: string) => {
        if (status === '已送達(委託完成)') return OrderStatus.DELIVERED;
        return status;
    };

    const getStatusIndex = (status: string, statusArray: string[]) => statusArray.indexOf(normalizeStatus(status) as any);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl overflow-hidden">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <Link to="/" className="text-siam-blue hover:text-siam-dark transition-colors mb-4 inline-flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>返回首頁</span>
            </Link>
            <h1 className="text-4xl font-bold text-siam-dark mb-2 break-words">訂單進度查詢</h1>
            <p className="text-lg text-siam-brown mb-8 break-words">請用 <span className="font-bold text-siam-dark">暱稱</span> 或 <span className="font-bold text-siam-dark">訂單編號</span> 查詢進度</p>
            
            <form onSubmit={handleSearch} className="bg-white/50 p-6 rounded-lg shadow-md flex flex-col sm:flex-row gap-4 mb-8">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="輸入暱稱或訂單編號" 
                    className="flex-grow p-2 border border-siam-blue rounded-md focus:ring-2 focus:ring-siam-dark outline-none"
                />
                <button type="submit" disabled={isLoading} className="bg-siam-brown text-siam-cream py-2 px-6 rounded-lg shadow-md hover:bg-siam-dark transition-colors disabled:bg-gray-400">
                    {isLoading ? '查詢中...' : '查詢'}
                </button>
            </form>
            
            {error && <p className="text-red-600 text-center">{error}</p>}
            
            {isLoading && <div className="flex justify-center"><LoadingSpinner /></div>}

            {!isLoading && searched && orders.length === 0 && (
                <div className="text-center text-siam-brown p-6 bg-white/50 rounded-lg shadow-md">
                    <p>找不到符合的訂單，請確認輸入的資訊是否正確。</p>
                </div>
            )}

            <div className="space-y-12">
                {orders.map(order => {
                    const isDoll = order.type === 'doll';
                    const title = isDoll ? (order as DollOrder).title : (order as BadgeOrder).productTitle;
                    const price = isDoll ? (order as DollOrder).totalPrice : (order as BadgeOrder).price;
                    const dollOrder = isDoll ? (order as DollOrder) : null;
                    
                    // Select correct timeline array
                    const currentStatusArray = isDoll ? DollOrderStatusArray : BadgeOrderStatusArray;

                    // Combine legacy adminNotes (Doll only) and new messages, then sort by timestamp
                    const allMessages = [
                        ...(dollOrder?.adminNotes || []).map(note => ({
                            text: note.text,
                            sender: 'admin' as const,
                            timestamp: note.timestamp
                        })),
                        ...(order.messages || [])
                    ].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

                    return (
                    <div key={order.id} className="bg-white/50 p-4 md:p-6 rounded-lg shadow-md border-t-4 border-siam-blue w-full max-w-full">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                            <div className="w-full min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full text-white shrink-0 ${isDoll ? 'bg-purple-600' : 'bg-teal-600'}`}>
                                        {isDoll ? '小餅訂單' : '地攤訂單'}
                                    </span>
                                    <span className="font-mono bg-white px-2 py-0.5 rounded text-sm break-all">{order.orderId}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-siam-dark break-words">{title}</h2>
                                <p className="text-sm text-siam-brown mt-1">暱稱: <span className="font-bold break-all">{order.nickname}</span></p>
                            </div>
                            <div className="mt-2 md:mt-0 text-xl font-bold text-siam-cream bg-siam-blue px-4 py-1 rounded-full shadow-sm whitespace-nowrap self-start md:self-auto shrink-0">
                                {normalizeStatus(order.status)}
                            </div>
                        </div>

                        {/* Timeline Visualization */}
                        <div className="my-10">
                            {/* Mobile View: Vertical */}
                            <div className="md:hidden relative pl-4">
                                <div className="absolute left-[29px] top-2 bottom-6 w-0.5 bg-gray-200 z-0"></div>
                                {currentStatusArray.map((status, index) => {
                                    const currentIndex = getStatusIndex(order.status, currentStatusArray);
                                    const isCompleted = index <= currentIndex;
                                    const isCurrent = index === currentIndex;
                                    const isPast = index < currentIndex;
                                    
                                    return (
                                        <div key={status} className="relative flex items-start mb-6 last:mb-0 z-10">
                                            {isPast && <div className="absolute left-[29px] top-6 h-[calc(100%+8px)] w-0.5 bg-siam-blue z-0"></div>}
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-white ${isCurrent ? 'border-siam-blue ring-4 ring-siam-blue/20 scale-110' : isCompleted ? 'border-siam-blue' : 'border-gray-300'}`}>
                                                <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-siam-blue' : 'bg-gray-300'}`}></div>
                                            </div>
                                            <div className={`ml-4 pt-1 transition-colors duration-300 ${isCurrent ? 'text-siam-blue font-bold text-lg' : isCompleted ? 'text-siam-dark font-medium' : 'text-gray-400'}`}>{status}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop View: Horizontal */}
                            <div className="hidden md:flex items-center w-full overflow-x-auto pb-12 pt-4 px-10 hide-scrollbar">
                                {currentStatusArray.map((status, index) => {
                                    const currentIndex = getStatusIndex(order.status, currentStatusArray);
                                    const isCompleted = index <= currentIndex;
                                    const isCurrent = index === currentIndex;
                                    const isPast = index < currentIndex;

                                    return (
                                        <div key={status} className="flex items-center min-w-[100px] flex-1 last:flex-none last:min-w-0">
                                            <div className="flex flex-col items-center relative z-10">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCurrent ? 'border-siam-blue ring-4 ring-siam-blue/20 scale-125 bg-white' : isCompleted ? 'border-siam-blue bg-siam-blue' : 'border-gray-300 bg-gray-300'}`}>
                                                    {isCurrent && <div className="w-2 h-2 rounded-full bg-siam-blue"></div>}
                                                </div>
                                                <div className={`absolute top-8 w-28 text-center text-xs font-bold transition-colors duration-300 left-1/2 -translate-x-1/2 ${isCurrent ? 'text-siam-blue' : isCompleted ? 'text-siam-blue/80' : 'text-gray-400'}`}>{status}</div>
                                            </div>
                                            {index < currentStatusArray.length - 1 && <div className={`h-1 flex-grow min-w-[2rem] mx-[-1px] z-0 ${isPast ? 'bg-siam-blue' : 'bg-gray-300'}`}></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Order Details Section */}
                        <div className="bg-white/40 p-4 rounded-lg mb-6 border border-siam-blue/10 w-full max-w-full">
                            <h3 className="font-bold text-lg text-siam-dark mb-2 border-b border-siam-blue/20 pb-1">委託明細</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {isDoll && (
                                    <div>
                                        <span className="font-bold text-siam-blue">頭飾工藝：</span>
                                        <span className="text-siam-brown">{dollOrder!.headpieceCraft}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="font-bold text-siam-blue">總金額：</span>
                                    <span className="text-siam-brown">NT$ {price}</span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="font-bold text-siam-blue">聯絡方式：</span>
                                    <span className="text-siam-brown font-mono break-all">{(order as any).contact || '未填寫'}</span>
                                </div>
                                {isDoll && (
                                    <div className="md:col-span-2">
                                        <span className="font-bold text-siam-blue">加價購項目：</span>
                                        <span className="text-siam-brown break-words">{dollOrder!.addons && dollOrder!.addons.length > 0 ? dollOrder!.addons.map(a => a.name).join('、') : '無'}</span>
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <span className="font-bold text-siam-blue">備註：</span>
                                    <p className="text-siam-brown whitespace-pre-wrap mt-1 bg-white/50 p-2 rounded break-words">{order.remarks || '無'}</p>
                                </div>
                            </div>
                        </div>

                        {isDoll ? (
                            <div className="grid md:grid-cols-2 gap-8 mt-4">
                                {/* Left Column: Images & Instructions */}
                                <div className="space-y-8 w-full min-w-0">
                                    <div>
                                        <h3 className="font-bold text-lg text-siam-dark mb-3 border-b border-siam-blue/20 pb-1">進度預覽</h3>
                                        {order.progressImageUrls.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {order.progressImageUrls.map((url, idx) => (
                                                    <img key={idx} src={url} alt={`Progress ${idx}`} className="rounded-lg shadow-sm hover:shadow-md transition-shadow w-full h-40 object-cover cursor-pointer hover:scale-[1.02] transform duration-200"/>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white/40 rounded-lg p-8 text-center text-gray-500 italic border-2 border-dashed border-gray-300">掌櫃還沒上傳進度圖喔</div>
                                        )}
                                    </div>
                                    <CareInstructions />
                                </div>

                                {/* Right Column: Messages & Notes */}
                                <div className="flex flex-col h-full w-full min-w-0">
                                    <h3 className="font-bold text-lg text-siam-dark mb-3 border-b border-siam-blue/20 pb-1">留言板</h3>
                                    <div className="bg-white/60 rounded-lg p-4 flex-grow flex flex-col h-[500px]">
                                        {/* Messages Display Area */}
                                        <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2">
                                            {allMessages.map((msg, index) => (
                                                <div key={`msg-${index}`} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`p-3 max-w-[85%] shadow-sm ${msg.sender === 'customer' ? 'bg-siam-brown text-siam-cream rounded-l-xl rounded-tr-xl' : 'bg-siam-blue text-white rounded-r-xl rounded-tl-xl'}`}>
                                                        <p className="text-xs opacity-75 mb-1 flex justify-between gap-4">
                                                            <span>{msg.sender === 'customer' ? '我' : '掌櫃'}</span>
                                                            <span>{new Date(msg.timestamp.toMillis()).toLocaleString()}</span>
                                                        </p>
                                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {allMessages.length === 0 && (
                                                <div className="text-center text-gray-400 mt-10"><p>尚無對話紀錄</p><p className="text-sm">有什麼問題都可以直接在這裡留言給掌櫃喔！</p></div>
                                            )}
                                        </div>

                                        {/* Message Input Area */}
                                        <form onSubmit={(e) => handleSendMessage(order, e)} className="border-t border-gray-200 pt-3 w-full">
                                            <div className="flex gap-2 w-full">
                                                <input 
                                                    type="text" 
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="輸入訊息..." 
                                                    className="flex-1 p-2 border border-siam-blue/30 rounded-md focus:ring-2 focus:ring-siam-dark outline-none bg-white min-w-0"
                                                />
                                                <button 
                                                    type="submit" 
                                                    disabled={!newMessage.trim() || sendingMsgId === order.id}
                                                    className="bg-siam-brown text-siam-cream px-4 py-2 rounded-md hover:bg-siam-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                                                >
                                                    {sendingMsgId === order.id ? '...' : '發送'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Badge Order Layout - Horizontal Message Board (Full Width) */
                            <div className="mt-6 w-full min-w-0">
                                <h3 className="font-bold text-lg text-siam-dark mb-3 border-b border-siam-blue/20 pb-1">留言板</h3>
                                <div className="bg-white/60 rounded-lg p-4 flex flex-col h-[400px]">
                                    {/* Messages Display Area */}
                                    <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2">
                                        {allMessages.map((msg, index) => (
                                            <div key={`msg-${index}`} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`p-3 max-w-[85%] shadow-sm ${msg.sender === 'customer' ? 'bg-siam-brown text-siam-cream rounded-l-xl rounded-tr-xl' : 'bg-siam-blue text-white rounded-r-xl rounded-tl-xl'}`}>
                                                    <p className="text-xs opacity-75 mb-1 flex justify-between gap-4">
                                                        <span>{msg.sender === 'customer' ? '我' : '掌櫃'}</span>
                                                        <span>{new Date(msg.timestamp.toMillis()).toLocaleString()}</span>
                                                    </p>
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {allMessages.length === 0 && (
                                            <div className="text-center text-gray-400 mt-10"><p>尚無對話紀錄</p><p className="text-sm">有什麼問題都可以直接在這裡留言給掌櫃喔！</p></div>
                                        )}
                                    </div>

                                    {/* Message Input Area */}
                                    <form onSubmit={(e) => handleSendMessage(order, e)} className="border-t border-gray-200 pt-3 w-full">
                                        <div className="flex gap-2 w-full">
                                            <input 
                                                type="text" 
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="輸入訊息..." 
                                                className="flex-1 p-2 border border-siam-blue/30 rounded-md focus:ring-2 focus:ring-siam-dark outline-none bg-white min-w-0"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={!newMessage.trim() || sendingMsgId === order.id}
                                                className="bg-siam-brown text-siam-cream px-4 py-2 rounded-md hover:bg-siam-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                                            >
                                                {sendingMsgId === order.id ? '...' : '發送'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );})}
            </div>
        </div>
    );
};

export default OrderStatusPage;
