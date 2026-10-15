import { checkAdminSecret, grantOwnerRole, getAllowedIds } from '../lib/discord.js';

// POST /api/grant  { userId: "..." }
// Header: x-admin-secret: ADMIN_SECRET
// Chỉ cấp cho user nằm trong ALLOWED_USER_IDS -> chống người lạ tự cấp
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!checkAdminSecret(req)) {
    return res.status(401).json({ error: 'Sai ADMIN_SECRET' });
  }

  try {
    const guildId = process.env.GUILD_ID;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Thiếu userId' });

    const allowed = getAllowedIds();
    if (allowed.length > 0 && !allowed.includes(userId)) {
      return res.status(403).json({
        error: `User ${userId} không nằm trong ALLOWED_USER_IDS. Vì an toàn nên bot từ chối cấp Owner cho người lạ.`
      });
    }

    const role = await grantOwnerRole(guildId, userId);
    return res.status(200).json({
      ok: true,
      message: `Đã cấp role ${role.name} cho <@${userId}>`,
      roleId: role.id
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
