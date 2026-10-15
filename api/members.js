import { checkAdminSecret, fetchAllMembers } from '../lib/discord.js';

// GET /api/members?search=xxx
// Header: x-admin-secret: ADMIN_SECRET
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!checkAdminSecret(req)) {
    return res.status(401).json({ error: 'Sai ADMIN_SECRET' });
  }

  try {
    const guildId = process.env.GUILD_ID;
    if (!guildId) return res.status(500).json({ error: 'Thiếu GUILD_ID' });

    const search = (req.query.search || '').toLowerCase().trim();
    const members = await fetchAllMembers(guildId, 3000);

    let list = members.map(m => ({
      id: m.user.id,
      username: m.user.username,
      globalName: m.user.global_name || '',
      nick: m.nick || '',
      bot: !!m.user.bot
    }));

    if (search) {
      list = list.filter(u =>
        u.username.toLowerCase().includes(search) ||
        (u.globalName && u.globalName.toLowerCase().includes(search)) ||
        (u.nick && u.nick.toLowerCase().includes(search)) ||
        u.id.includes(search)
      ).slice(0, 100);
    } else {
      list = list.slice(0, 200);
    }

    return res.status(200).json({ count: list.length, members: list });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
