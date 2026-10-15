// GET /api/discord-user?id=xxx
// Dùng BOT_TOKEN để tra username / nickname / avatar, không cần OAuth
module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id || !/^\d{15,25}$/.test(id)) {
    return res.status(400).json({ error: 'ID không hợp lệ' });
  }
  const token = process.env.DISCORD_TOKEN;
  if (!token) return res.status(500).json({ error: 'Chưa cấu hình DISCORD_TOKEN trên Vercel' });

  const r = await fetch(`https://discord.com/api/v10/users/${id}`, {
    headers: { Authorization: `Bot ${token}` }
  });
  if (!r.ok) return res.status(404).json({ error: 'Không tìm thấy user (sai ID hoặc bot chưa chung server?)' });
  const u = await r.json();

  const avatarURL = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${Number(u.discriminator || 0) % 5}.png`;

  return res.status(200).json({
    id: u.id,
    username: u.username,          // username hệ mới (@xxx)
    global_name: u.global_name,   // nickname hiển thị toàn cục
    avatarURL
  });
};
