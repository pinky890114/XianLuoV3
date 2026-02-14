
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
    adminNotes: AdminNote[];
    messages: Message[];
    progressImageUrls: string[];
    createdAt: Timestamp;
}

// --- 暹羅地攤相關型別 ---

export interface ProductSpec {
    specName: string;
    price: number;
    imageUrl: string;
    isActive: boolean;
}

export interface Product {
    id: string;
    categoryId: string; // 如：'快閃櫥窗', '金屬徽章', '棉花製品'
    seriesName: string; // 如：'【goodslove】劍影俠光'
    specs: ProductSpec[];
    basicDescription?: string; // 基本說明
    priceDescription?: string; // 價格說明
}

export interface BadgeOrder {
    id: string;
    orderId: string;
    nickname: string;
    productTitle: string; // 完整名稱：[分類] 系列 - 規格
    price: number;
    status: OrderStatus;
    messages: Message[];
    progressImageUrls: string[];
    createdAt: Timestamp;
    remarks: string;
}
