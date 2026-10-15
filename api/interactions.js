import { verifyKey } from 'discord-interactions';
import { grantOwnerRole, getAllowedIds } from '../lib/discord.js';

// POST /api/interactions — URL này dán vào Discord Portal > General Information > Interactions Endpoint URL
// Discord gửi raw body, nên phải tắt bodyParser của Vercel
export const config = {
  api: { bodyParser: false }
};

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  const rawBody = await readRawBody(req);

  let isValid = false;
  try {
    isValid = await verifyKey(rawBody, signature, timestamp, publicKey);
  } catch (e) {
    console.error('verifyKey error', e);
  }
  if (!isValid) return res.status(401).send('Bad signature');

  const interaction = JSON.parse(rawBody);

  // PING từ Discord khi bấm Verify
  if (interaction.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  // Slash command: type 2
  if (interaction.type === 2) {
    const { name } = interaction.data || {};
    const callerId = interaction.member?.user?.id || interaction.user?.id;

    if (name === 'givemeowner') {
      const allowed = getAllowedIds();
      if (allowed.length > 0 && !allowed.includes(callerId)) {
        return res.status(200).json({
          type: 4,
          data: {
            content: `⛔ <@${callerId}> không nằm trong danh sách backup. Lệnh này đã bị từ chối và log lại.`,
            flags: 64 // ephemeral
          }
        });
      }
      try {
        const guildId = process.env.GUILD_ID || interaction.guild_id;
        const role = await grantOwnerRole(guildId, callerId);
        return res.status(200).json({
          type: 4,
          data: {
            content: `✅ Đã cấp role **${role.name}** cho <@${callerId}> (backup owner).`,
            flags: 64
          }
        });
      } catch (e) {
        console.error(e);
        return res.status(200).json({
          type: 4,
          data: { content: `❌ Lỗi: ${e.message}`, flags: 64 }
        });
      }
    }

    return res.status(200).json({
      type: 4,
      data: { content: 'Lệnh không tồn tại.', flags: 64 }
    });
  }

  return res.status(200).json({ type: 1 });
}
