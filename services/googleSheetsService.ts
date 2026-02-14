import { GOOGLE_SCRIPT_URL } from '../constants';
import { DollOrder } from '../types';

export const syncOrderToGoogleSheet = async (order: Partial<DollOrder>) => {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL') {
        console.warn('Google Script URL is not configured.');
        return;
    }

    // 準備要傳送的資料，必須符合 Google Sheet 的格式需求
    const payload = {
        orderId: order.orderId,
        createdAt: order.createdAt ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
        nickname: order.nickname,
        title: order.title,
        totalPrice: order.totalPrice,
        status: order.status,
        remarks: order.remarks || ''
    };

    try {
        // 使用 no-cors 模式發送，因為 GAS 預設會有 CORS 限制
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        console.log('Synced to Google Sheets:', payload.orderId);
    } catch (error) {
        console.error('Failed to sync to Google Sheets:', error);
    }
};