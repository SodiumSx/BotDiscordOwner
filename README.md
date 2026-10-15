# Discord Backup Owner Bot — chạy 100% trên Vercel (REST, không cần server 24/7)

Web dashboard: dropdown + ô tìm kiếm (hiện cả username lẫn nickname) → chọn người → cấp role Owner.
Lệnh slash: `/givemeowner` → tự cấp Owner cho mình.

> BẢN NÀY ĐÃ KHÓA AN TOÀN:
> - Web yêu cầu `ADMIN_SECRET`
> - Cả web lẫn `/givemeowner` CHỈ cấp cho user có trong `ALLOWED_USER_IDS` (acc chính + acc phụ của bạn)
> - Người lạ dù vào web hay gõ lệnh đều bị từ chối.

## 1. Chuẩn bị trên Discord Developer Portal

1. Vào https://discord.com/developers/applications → New Application
2. Tab **Bot** → Reset Token → copy `DISCORD_TOKEN`
   - Bật 3 Privileged Intent: `SERVER MEMBERS INTENT`, `PRESENCE` không cần, chỉ cần Members.
3. Tab **General Information** → copy `APPLICATION ID` và `PUBLIC KEY`
4. Tab **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator` (hoặc tối thiểu Manage Roles)
   - Mở URL đó → invite bot vào server của bạn.
5. Bật Developer Mode trong Discord (Settings → Advanced) → chuột phải server → Copy Server ID = `GUILD_ID`
   - Chuột phải acc chính + acc phụ → Copy User ID → cho vào `ALLOWED_USER_IDS`
6. Kéo role của bot lên CAO HƠN role Owner trong Server Settings → Roles (nếu không bot sẽ báo Missing Permissions).

## 2. Deploy lên Vercel

1. Push thư mục này lên GitHub.
2. Vercel → New Project → Import repo.
3. Tab **Environment Variables** thêm đủ:
   - `DISCORD_TOKEN`, `DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY`, `GUILD_ID`, `ALLOWED_USER_IDS`, `ADMIN_SECRET`, (optional `OWNER_ROLE_ID`)
4. Deploy → bạn được URL ví dụ `https://ten-project.vercel.app`
5. Quay lại Discord Portal → General Information → **Interactions Endpoint URL** dán:
   `https://ten-project.vercel.app/api/interactions` → Save (phải hiện Verified).
6. Đăng ký lệnh: trên máy local chạy:
   ```
   npm install
   $env:DISCORD_TOKEN="..."; $env:DISCORD_APP_ID="..."; $env:DISCORD_GUILD_ID="..."
   npm run register
   ```
   Hoặc chạy 1 lần trên Vercel / local với env tương ứng.

## 3. Sử dụng

- Mở `https://ten-project.vercel.app/` → nhập ADMIN_SECRET → gõ tìm kiếm → list hiện `username + nickname + ID` → click chọn → bấm **Cấp quyền Owner**.
- Trong Discord gõ `/givemeowner` (chỉ acc trong whitelist mới được, acc khác gõ sẽ bị từ chối).

## 4. Bảo mật bắt buộc

- Token bạn đã dán trong chat đã LỘ → vào Bot tab → **Reset Token ngay**, lấy token mới cho vào Vercel Env, không bao giờ paste token lên chat.
- Không share URL web + ADMIN_SECRET cho ai.
- Dùng xong nên đổi ADMIN_SECRET hoặc xóa deployment.
- Discord "Owner" thật (crown) không cấp qua role được — ở đây là role `Owner` quyền Administrator. Muốn chuyển crown thật phải Transfer Ownership trong Server Settings (bot không làm thay được).

## Cấu trúc

- `public/index.html` — web dropdown + search
- `api/members.js` — GET list member (REST)
- `api/grant.js` — POST cấp role
- `api/interactions.js` — xử lý slash /givemeowner
- `lib/discord.js` — helper REST
- `scripts/register-commands.js` — đăng ký lệnh
