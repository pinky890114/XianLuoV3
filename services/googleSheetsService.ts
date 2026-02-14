
import { GOOGLE_SCRIPT_URL } from '../constants';
import { DollOrder, BadgeOrder } from '../types';

/**
 * 將訂單同步到 Google Sheets。
 * 採「更新或新增」邏輯：
 * - 如果編號存在則更新狀態/價格。
 * - 如果編號不存在則新增。
 * - 刪除操作不會同步，確保 Sheet 保留存檔。
 */
export const syncOrderToGoogleSheet = async (order: Partial<DollOrder | BadgeOrder>, type: 'doll' | 'badge' = 'doll') => {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('script.google.com') === false) {
        console.warn('Google Script URL is not properly configured.');
        return;
    }

    // 根據訂單類型決定 Sheet 中的分頁名稱
    const sheetName = type === 'doll' ? '小餅訂單' : '地攤訂單';

    // 統一欄位映射
    const payload = {
        sheetName,
        orderId: order.orderId,
        // 處理不同來源的日期格式
        createdAt: order.createdAt 
            ? (typeof (order.createdAt as any).toDate === 'function' 
                ? (order.createdAt as any).toDate().toLocaleString() 
                : new Date((order.createdAt as any)).toLocaleString())
            : new Date().toLocaleString(),
        nickname: order.nickname,
        // 處理 DollOrder (title) 與 BadgeOrder (productTitle) 的欄位差異
        title: type === 'doll' ? (order as DollOrder).title : (order as BadgeOrder).productTitle,
        // 處理 DollOrder (totalPrice) 與 BadgeOrder (price) 的欄位差異
        totalPrice: type === 'doll' ? (order as DollOrder).totalPrice : (order as BadgeOrder).price,
        status: order.status,
        remarks: order.remarks || ''
    };

    try {
        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload));

        // 使用 no-cors 會導致無法讀取 Response，但對單向發送有效
        // 這裡維持標準 fetch 以便確認同步結果
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.result === 'success') {
            console.log(`[GoogleSheet] ${sheetName} 同步成功: ${order.orderId}`);
        } else {
            console.error(`[GoogleSheet] 同步失敗: ${result.error}`);
        }

    } catch (error) {
        console.error('[GoogleSheet] 連線異常:', error);
        // 不阻斷 App 流程，僅記錄錯誤
    }
};
