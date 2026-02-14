
import { Addon } from './types';

export const DOLL_BASE_PRICE = 700;

export const DOLL_ADDONS: Addon[] = [
    { id: 'a5-pouch-1', name: 'A5活頁收納袋一格', price: 8 },
    { id: 'a5-pouch-2', name: 'A5活頁收納袋兩格', price: 8 },
    { id: 'sticker-paper', name: '保護膜標籤紙20個', price: 4 },
    { id: 'glue-30ml', name: '30ml保麗龍膠', price: 13 },
    { id: 'stand-bag-black', name: '基礎款立牌包黑色', price: 75 },
    { id: 'stand-bag-white', name: '基礎款立牌包白色', price: 75 },
    { id: 'stand-bag-red', name: '基礎款立牌包紅色', price: 75 },
    { id: 'stand-bag-pink', name: '基礎款立牌包粉色', price: 75 },
    { id: 'stand-bag-orange', name: '基礎款立牌包橘色', price: 75 },
    { id: 'stand-bag-yellow', name: '基礎款立牌包黃色', price: 75 },
    { id: 'stand-bag-green', name: '基礎款立牌包綠色', price: 75 },
    { id: 'stand-bag-blue', name: '基礎款立牌包藍色', price: 75 },
    { id: 'stand-bag-purple', name: '基礎款立牌包紫色', price: 75 },
];

export const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL'; // TODO: Replace with your Discord webhook URL

// TODO: 請將 Google Apps Script 部署後的 Web App URL 貼在這裡
export const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL'; 

export const ADMIN_EMAILS = [
    'admin1@siam.com', 
    'admin2@siam.com'
]; // Note: For a real app, manage admin roles in Firebase, not client-side.
