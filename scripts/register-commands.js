// Chạy: npm run register  (cần set env trước)
// Đăng ký lệnh /givemeowner (guild command = hiện ngay)
const APP_ID = process.env.DISCORD_APP_ID;
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!APP_ID || !TOKEN || !GUILD_ID) {
  console.error('Thiếu DISCORD_APP_ID / DISCORD_TOKEN / GUILD_ID');
  process.exit(1);
}

const commands = [
  {
    name: 'givemeowner',
    description: 'Backup: tự cấp role Owner cho mình (chỉ acc whitelist)',
  }
];

const res = await fetch(
  `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  }
);

console.log('Status:', res.status);
console.log(await res.text());
