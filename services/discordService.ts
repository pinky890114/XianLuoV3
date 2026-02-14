
import { DISCORD_WEBHOOK_URL } from '../constants';
import { DollOrder } from '../types';

export const sendDiscordNotification = async (order: Omit<DollOrder, 'id' | 'orderId' | 'status' | 'adminNotes' | 'progressImageUrls' | 'createdAt'>) => {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
        console.warn('Discord webhook URL is not configured.');
        return;
    }

    const addonsText = order.addons.length > 0 ? order.addons.map(a => a.name).join(', ') : '無';

    const embed = {
        title: `新的 Nocy餅舖 訂單！`,
        color: 0x4F5D75, // siam-blue
        fields: [
            { name: '暱稱', value: order.nickname, inline: true },
            { name: '委託標題', value: order.title, inline: true },
            { name: '總金額', value: `NT$ ${order.totalPrice}`, inline: true },
            { name: '頭飾工藝', value: order.headpieceCraft, inline: false },
            { name: '加價購', value: addonsText, inline: false },
            { name: '備註', value: order.remarks || '無', inline: false },
        ],
        timestamp: new Date().toISOString(),
    };

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ embeds: [embed] }),
        });
    } catch (error) {
        console.error('Failed to send Discord notification:', error);
    }
};
