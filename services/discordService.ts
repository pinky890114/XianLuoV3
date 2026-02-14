import { DISCORD_WEBHOOK_URL } from '../constants';
import { DollOrder } from '../types';

export const sendDiscordNotification = async (order: Omit<DollOrder, 'id' | 'orderId' | 'status' | 'adminNotes' | 'progressImageUrls' | 'createdAt'>) => {
    // 檢查 URL 是否設定，若是預設字串則不發送
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('YOUR_DISCORD_WEBHOOK_URL')) {
        console.warn('Discord webhook URL is not configured.');
        return;
    }

    const addonsText = order.addons.length > 0 ? order.addons.map(a => a.name).join(', ') : '無';
    
    // 如果有參考圖，取第一張當作縮圖
    const thumbnailUrl = order.referenceImageUrls && order.referenceImageUrls.length > 0 
        ? order.referenceImageUrls[0] 
        : undefined;

    const embed = {
        title: `✨ 新的 Nocy餅舖 委託單！`,
        description: `來自 **${order.nickname}** 的委託`,
        color: 0x4F5D75, // siam-blue Hex color
        thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined,
        fields: [
            { name: '📋 委託標題', value: order.title, inline: true },
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

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username: "Nocy 報單機器人", // 您可以在這裡自訂機器人名稱
                avatar_url: "https://i.ibb.co/HpHPGzRT/IMG-4596.jpg", // 可以換成您喜歡的頭像 URL
                embeds: [embed] 
            }),
        });
        console.log('Discord notification sent successfully.');
    } catch (error) {
        console.error('Failed to send Discord notification:', error);
    }
};