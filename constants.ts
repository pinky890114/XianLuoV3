
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

// ===================================================================================
//  設定 Discord 通知
//  請將您的 Discord Webhook URL 貼在下方的引號中
//  例如: 'https://discord.com/api/webhooks/123456789/abcdefg...'
// ===================================================================================
export const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1472270501874368532/YdQUojYp9v6rogI2oogBov0fTr699PHT__UtG1abBZ2e9tpH4ERWcpZwTtIjt5bThEU_'; 

// ===================================================================================
//  非常重要！
//  請點擊 Google Apps Script 右上角的「部署」>「新增部署作業」，
//  然後將部署成功後產生的「全新」網頁應用程式 URL 完整地貼在下方引號中。
// ===================================================================================
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxHVZt2citRD3oOsaYouo2Ru4luEYf7SDclMd2G0fVT9JWLF4hAZXsPUddK4MP37e_2xg/exec'; 

// ===================================================================================
//  後台管理員 Email 白名單
//  請在下方填入允許進入後台的 Gmail 地址
// ===================================================================================
export const ADMIN_EMAILS = [
    'chipmangochan@gmail.com',
    'pinky890114@gmail.com'
];
