// Helper dùng chung cho các API routes trên Vercel (REST-only, không cần gateway websocket)
const DISCORD_API = 'https://discord.com/api/v10';

function env(name, required = true) {
  const v = process.env[name];
  if (required && !v) throw new Error(`Thiếu env ${name}`);
  return v;
}

export function checkAdminSecret(req) {
  const secret = env('ADMIN_SECRET');
  // Cho phép gửi qua header x-admin-secret hoặc query ?secret= (frontend dùng header)
  const got =
    req.headers['x-admin-secret'] ||
    req.headers['x_admin_secret'] ||
    req.query?.secret;
  return got === secret;
}

export function getAllowedIds() {
  return (process.env.ALLOWED_USER_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export async function discordFetch(path, options = {}) {
  const token = env('DISCORD_TOKEN');
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord API ${res.status} ${path}: ${text.slice(0, 500)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Lấy toàn bộ member (tối đa 5000, paginate theo after). Yêu cầu bật SERVER MEMBERS INTENT.
export async function fetchAllMembers(guildId, limit = 2000) {
  let members = [];
  let after = '0';
  while (members.length < limit) {
    const batch = await discordFetch(
      `/guilds/${guildId}/members?limit=1000&after=${after}`
    );
    if (!batch.length) break;
    members = members.concat(batch);
    if (batch.length < 1000) break;
    after = batch[batch.length - 1].user.id;
  }
  return members;
}

// Tìm hoặc tạo role Owner (Administrator)
export async function getOrCreateOwnerRole(guildId) {
  if (process.env.OWNER_ROLE_ID) {
    const role = await discordFetch(`/guilds/${guildId}/roles`);
    const found = role.find(r => r.id === process.env.OWNER_ROLE_ID);
    if (!found) throw new Error('OWNER_ROLE_ID không tồn tại trong server');
    return found;
  }
  const roles = await discordFetch(`/guilds/${guildId}/roles`);
  let owner = roles.find(r => r.name.toLowerCase() === 'owner');
  if (owner) return owner;

  // Tạo mới role Owner với quyền Administrator (1 << 3 = 8)
  owner = await discordFetch(`/guilds/${guildId}/roles`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Owner',
      permissions: '8',
      color: 0xff0000,
      hoist: true,
      mentionable: false
    })
  });
  return owner;
}

export async function grantOwnerRole(guildId, userId) {
  const role = await getOrCreateOwnerRole(guildId);
  await discordFetch(`/guilds/${guildId}/members/${userId}/roles/${role.id}`, {
    method: 'PUT'
  });
  return role;
}
