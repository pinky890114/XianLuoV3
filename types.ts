
import { Timestamp } from 'firebase/firestore';

export enum HeadpieceCraft {
    INTEGRATED = '跟頭髮一體',
    DETACHABLE = '可拆插入式',
    CLIPON = '通用夾式',
}

export interface Addon {
    id: string;
    name: string;
    price: number;
}

export enum OrderStatus {
    PENDING = '掌櫃確認中',
    ACCEPTED = '委託成立',
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
}

// 明確定義陣列順序以確保進度條顯示正確
export const OrderStatusArray = [
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

export interface Message {
    text: string;
    sender: 'admin' | 'customer';
    timestamp: Timestamp;
}

// 保留舊的 AdminNote 以相容舊資料，但主要邏輯將遷移至 messages
export interface AdminNote {
    text: string;
    timestamp: Timestamp;
}

export interface DollOrder {
    id: string;
    orderId: string;
    nickname: string;
    title: string;
    headpieceCraft: HeadpieceCraft;
    referenceImageUrls: string[];
    remarks: string;
    addons: Addon[];
    totalPrice: number;
    status: OrderStatus;
    adminNotes: AdminNote[]; // Deprecated, kept for backward compatibility
    messages: Message[]; // New field for 2-way communication
    progressImageUrls: string[];
    createdAt: Timestamp;
}

export interface BadgeOrder {
    id: string;
    orderId: string;
    nickname: string;
    mainCategory: string;
    subCategory: string;
    status: OrderStatus;
    adminNotes: AdminNote[];
    progressImageUrls: string[];
    createdAt: Timestamp;
}
