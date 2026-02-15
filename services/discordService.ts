
import { DISCORD_WEBHOOK_URL } from '../constants';
import { DollOrder, BadgeOrder } from '../types';

// 通用的 Webhook 發送函式
const sendToWebhook = async (embed: any) => {
    // 檢查 URL 是否設定
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('YOUR_DISCORD_WEBHOOK_URL')) {
        console.warn('Discord webhook URL is not configured.');
        return;
    }

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username: "Nocy 報單機器人", 
                avatar_url: "https://i.ibb.co/HpHPGzRT/IMG-4596.jpg", 
                embeds: [embed] 
            }),
        });
        console.log('Discord notification sent successfully.');
    } catch (error) {
        console.error('Failed to send Discord notification:', error);
    }
};

// 1. 小餅訂單通知 (Nocy Boutique)
// Added 'messages' to Omit to fix type error in AdoptionWizardPage.tsx
export const sendDollOrderNotification = async (order: Omit<DollOrder, 'id' | 'orderId' | 'status' | 'adminNotes' | 'progressImageUrls' | 'createdAt' | 'messages'> & { orderId?: string }) => {
    const addonsText = order.addons.length > 0 ? order.addons.map(a => a.name).join(', ') : '無';
    
    // 如果有參考圖，取第一張當作縮圖
    const thumbnailUrl = order.referenceImageUrls && order.referenceImageUrls.length > 0 
        ? order.referenceImageUrls[0] 
        : undefined;

    const embed = {
        title: `✨ 新的 [Nocy餅舖] 委託單！`,
        description: `來自 **${order.nickname}** 的小餅委託`,
        color: 0x4F5D75, // siam-blue
        thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined,
        fields: [
            { name: '🧾 訂單編號', value: order.orderId || '處理中...', inline: true },
            { name: '📋 委託標題', value: order.title, inline: true },
            { name: '📞 聯絡方式', value: order.contact, inline: true },
            { name: '💰 預估金額', value: `NT$ ${order.totalPrice}`, inline: true },
            { name: '🎀 頭飾工藝', value: order.headpieceCraft, inline: true },
            { name: '🛒 加購項目', value: addonsText, inline: false },
            { name: '📝 備註', value: order.remarks || '無', inline: false },
        ],
        footer: {
            text: '暹羅的賠錢生意 - 自動通知系統',
        },
        timestamp: new Date().toISOString(),
    };

    await sendToWebhook(embed);
};

// 2. 地攤訂單通知 (Siam Stall)
export const sendBadgeOrderNotification = async (order: Omit<BadgeOrder, 'id' | 'status' | 'messages' | 'progressImageUrls' | 'createdAt'>) => {
    
    const embed = {
        title: `🎪 新的 [暹羅地攤] 委託單！`,
        description: `來自 **${order.nickname}** 的地攤委託`,
        color: 0x6B4F4F, // siam-brown
        fields: [
            { name: '🧾 訂單編號', value: order.orderId, inline: true },
            { name: '💰 總金額', value: `NT$ ${order.price}`, inline: true },
            { name: '📞 聯絡方式', value: order.contact, inline: true },
            { name: '📦 委託內容', value: `\`\`\`${order.productTitle}\`\`\``, inline: false },
            { name: '📝 備註', value: order.remarks || '無', inline: false },
        ],
        footer: {
            text: '暹羅的賠錢生意 - 自動通知系統',
        },
        timestamp: new Date().toISOString(),
    };

    await sendToWebhook(embed);
};
