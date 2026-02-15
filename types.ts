
import { Timestamp } from 'firebase/firestore';

export enum HeadpieceCraft {
    INTEGRATED = '跟頭髮一體',
    DETACHABLE = '可拆插入式',
    CLIPON = '通用夾式',
    NONE = '沒有頭飾',
}

export interface Addon {
    id: string;
    name: string;
    price: number;
}

export enum OrderStatus {
    // --- Common / Legacy ---
    PENDING = '掌櫃確認中',
    ACCEPTED = '委託成立',
    
    // --- Doll Flow ---
    CONCEPT_DRAWING = '效果圖繪製中',
    CONCEPT_REVIEW = '效果圖確認中',
    CONCEPT_CONFIRMED = '效果圖已確認',
    MAKING = '小餅製作中',
    PRODUCT_CONFIRMED = '成品圖已確認',
    ARTIST_SHIPPED = '老師已發貨',
    WAREHOUSE_ARRIVED = '集運倉已入倉',
    CONSOLIDATING = '集運中',
    SIAM_SORTING = '暹羅分裝中',
    SIAM_SHIPPED = '暹羅已出貨',
    DELIVERED = '已送達',

    // --- Badge/Stall Flow (New) ---
    QUANTITY_SURVEY = '數量調查中',
    SHARED_PAYMENT = '均攤收款中',
    SAMPLE_PRODUCTION = '樣品製作中',
    BULK_PAYMENT = '大貨收款中',
    LEADER_SHIPPING = '團主出貨中',
    CONSOLIDATED_SHIPPING = '集運出貨中',
    SIAM_PACKING = '暹羅打包中',
    // SIAM_SHIPPED is shared
    TRANSACTION_COMPLETE = '交易完成'
}

// 小餅訂單流程
export const DollOrderStatusArray = [
    OrderStatus.PENDING,
    OrderStatus.ACCEPTED,
    OrderStatus.CONCEPT_DRAWING,
    OrderStatus.CONCEPT_REVIEW,
    OrderStatus.CONCEPT_CONFIRMED,
    OrderStatus.MAKING,
    OrderStatus.PRODUCT_CONFIRMED,
    OrderStatus.ARTIST_SHIPPED,
    OrderStatus.WAREHOUSE_ARRIVED,
    OrderStatus.CONSOLIDATING,
    OrderStatus.SIAM_SORTING,
    OrderStatus.SIAM_SHIPPED,
    OrderStatus.DELIVERED,
];

// 地攤訂單流程
export const BadgeOrderStatusArray = [
    OrderStatus.QUANTITY_SURVEY,
    OrderStatus.SHARED_PAYMENT,
    OrderStatus.SAMPLE_PRODUCTION,
    OrderStatus.BULK_PAYMENT,
    OrderStatus.LEADER_SHIPPING,
    OrderStatus.CONSOLIDATED_SHIPPING,
    OrderStatus.WAREHOUSE_ARRIVED, // Optional: Keep warehouse logic if needed, or skip
    OrderStatus.SIAM_PACKING,
    OrderStatus.SIAM_SHIPPED,
    OrderStatus.TRANSACTION_COMPLETE,
];

// Combine for legacy support or generic lookups if needed
export const OrderStatusArray = [
    ...DollOrderStatusArray,
    ...BadgeOrderStatusArray
];

export interface Message {
    text: string;
    sender: 'admin' | 'customer';
    timestamp: Timestamp;
}

export interface AdminNote {
    text: string;
    timestamp: Timestamp;
}

export interface DollOrder {
    id: string;
    orderId: string;
    nickname: string;
    contact: string; // 聯絡方式
    title: string;
    headpieceCraft: HeadpieceCraft;
    referenceImageUrls: string[];
    remarks: string;
    addons: Addon[];
    totalPrice: number;
    status: OrderStatus;
    adminNotes: AdminNote[];
    messages: Message[];
    progressImageUrls: string[];
    createdAt: Timestamp;
}

// --- 暹羅地攤相關型別 ---

export interface ProductSpec {
    style?: string; // e.g., '長歌', '藏劍' - 用於前台分組顯示
    specName: string;
    price: number;
    imageUrl: string;
    isActive: boolean;
}

export interface Product {
    id: string;
    categoryId: string; // 如：'快閃櫥窗', '金屬徽章', '棉花製品'
    seriesName: string; // 如：'【goodslove】劍影俠光'
    status?: 'active' | 'preview' | 'off'; // 商品狀態：active(上架/預設), preview(預覽/預定開團), off(下架)
    specs: ProductSpec[];
    basicDescription?: string; // 基本說明
    priceDescription?: string; // 價格說明
}

export interface BadgeOrder {
    id: string;
    orderId: string;
    nickname: string;
    contact: string; // 聯絡方式
    productTitle: string; // 完整名稱：[分類] 系列 - 規格
    price: number;
    status: OrderStatus;
    messages: Message[];
    progressImageUrls: string[];
    createdAt: Timestamp;
    remarks: string;
}
