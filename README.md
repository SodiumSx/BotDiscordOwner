# Bot Owner + Web Panel (Vercel)

## 1. Vercel có tốn tiền không?
**Không, nếu chỉ làm web panel như này: 0đ.**
- Gói Hobby Free: 100GB bandwidth/tháng, serverless function 100GB-giờ, deploy không giới hạn. Panel vài người dùng thì không bao giờ hết.
- Tốn tiền khi: nhiều traffic (>100GB), dùng Vercel Postgres/KV/Blob, hoặc team Pro ($20/user/tháng). Panel cá nhân thì không cần.

**Lưu ý quan trọng: Vercel KHÔNG chạy được bot Discord 24/7.**
Vercel chỉ chạy web theo request, không giữ websocket gateway Discord. Bot sẽ offline ngay.
=> Tách 2 phần:
- `web/` → deploy Vercel (free)
- `bot/` → treo ở Railway / Render / VPS / PC (bot mới cần online 24/7)

Bot free: Railway free $5 credit/tháng đủ 1 bot nhỏ, Render free bị ngủ sau 15p, VPS VN ~60-120k/tháng ổn định nhất, Oracle Cloud free cũng được.

## 2. Cơ chế chống mất acc
- `SUPER_OWNERS` trong `bot/.env`: ghi 2-3 ID từ đầu (acc chính + acc phụ + bạn thân). Lệnh `!addowner` chỉ SUPER mới dùng, không phụ thuộc web.
- `PANEL_PASSWORD` trên web: nếu mất acc Discord vẫn vào web bằng Vercel login + password này để thêm ID mới.
- Nếu mất cả acc Vercel + acc Discord thì chịu, nên Vercel nên login bằng email riêng, bật 2FA.

## 3. Chạy thử local
```powershell
cd bot; Copy-Item .env.example .env
npm install; npm start
# Mở web/index.html bằng Live Server, hoặc: npx vercel dev
```

## 4. Deploy Vercel (free)
1. Push thư mục `web/` lên GitHub
2. vercel.com → Add New Project → Import repo
3. Settings → Environment Variables, thêm 4 biến trong `web/.env.example`
4. Deploy → sẽ có link `https://xxx.vercel.app`
5. Lấy link `/api/owners` điền vào `OWNER_API_URL` của bot

## 5. Muốn lưu owners thật (không mất khi restart)?
Code mẫu đang lưu RAM demo. Khi chạy thật chọn 1:
- Vercel KV (Redis): free 30k lệnh/tháng, sửa `api/owners.js` tầm 10 dòng
- Supabase free / MongoDB Atlas free: bền nhất
- Hiện tại vẫn chạy được, nhưng restart là reset về `INITIAL_OWNERS`.

## Cấu trúc
```
bot/index.js      → check isOwner(), lệnh !ping (owner-only), !addowner (super-only)
web/index.html    → nhập ID → hiện avatar/username/nickname → Add/Remove
web/api/discord-user.js → tra Discord API bằng BOT_TOKEN
web/api/owners.js → danh sách ID được quyền
```
