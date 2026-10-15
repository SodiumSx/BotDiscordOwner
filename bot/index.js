require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('Thieu DISCORD_TOKEN trong .env');
  process.exit(1);
}

// 1. Super owner: hardcode trong .env, chống mất quyền web
const SUPER_OWNERS = (process.env.SUPER_OWNERS || '').split(',').map(s => s.trim()).filter(Boolean);
// 2. Owner động: lấy từ web panel (Vercel API)
const OWNER_API_URL = process.env.OWNER_API_URL || '';
const PANEL_SECRET = process.env.PANEL_SECRET || '';

let dynamicOwners = new Set();

async function refreshOwners() {
  if (!OWNER_API_URL) return;
  try {
    const res = await fetch(OWNER_API_URL, {
      headers: PANEL_SECRET ? { Authorization: `Bearer ${PANEL_SECRET}` } : {}
    });
    const data = await res.json();
    if (Array.isArray(data.ids)) {
      dynamicOwners = new Set(data.ids);
      console.log(`[owner] da load ${dynamicOwners.size} owner tu web:`, [...dynamicOwners]);
    }
  } catch (e) {
    console.error('[owner] khong load duoc tu web, giu cache cu:', e.message);
  }
}

function isOwner(userId) {
  return SUPER_OWNERS.includes(userId) || dynamicOwners.has(userId);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`Bot login: ${client.user.tag}`);
  refreshOwners();
  setInterval(refreshOwners, 60 * 1000); // sync mỗi 60s
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot || !msg.content.startsWith('!')) return;

  const [cmd] = msg.content.slice(1).trim().split(/\s+/);

  // Lệnh test quyền
  if (cmd === 'ping') {
    if (!isOwner(msg.author.id)) return msg.reply('❌ Bạn không có quyền dùng bot.');
    return msg.reply(`✅ Pong! Bạn là owner (${msg.author.username}).`);
  }

  // Chuyển quyền khẩn cấp khi mất acc chính:
  // Chỉ SUPER_OWNERS mới dùng được lệnh này, không phụ thuộc web
  if (cmd === 'addowner') {
    if (!SUPER_OWNERS.includes(msg.author.id)) {
      return msg.reply('❌ Chỉ SUPER_OWNER mới thêm được.');
    }
    const newId = msg.content.split(/\s+/)[1];
    if (!newId || !/^\d{15,25}$/.test(newId)) return msg.reply('Dùng: `!addowner <user_id>`');
    dynamicOwners.add(newId);
    return msg.reply(`✅ Đã thêm tạm ${newId} vào cache. Nhớ thêm luôn trên web panel để không mất khi restart.`);
  }
});

client.login(TOKEN);
