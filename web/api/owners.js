// Demo lưu owners. Vercel serverless không lưu file lâu dài được.
// => Khi deploy thật, thay bằng Vercel KV / Supabase / Mongo. Code bot đã hỗ trợ đọc qua GET.
// Biến môi trường trên Vercel:
//   DISCORD_TOKEN, PANEL_PASSWORD, PANEL_SECRET, INITIAL_OWNERS (cách nhau dấu phẩy)

let mem = null;

function getStore() {
  if (!mem) {
    const init = (process.env.INITIAL_OWNERS || '').split(',').map(s => s.trim()).filter(Boolean);
    mem = new Set(init);
  }
  return mem;
}

module.exports = async (req, res) => {
  const store = getStore();

  if (req.method === 'GET') {
    // Bot gọi mỗi 60s để sync. Nếu có PANEL_SECRET thì check.
    const auth = req.headers.authorization || '';
    if (process.env.PANEL_SECRET && auth !== `Bearer ${process.env.PANEL_SECRET}`) {
      // Cho phép GET public để demo, nhưng khuyến nghị bật SECRET khi chạy thật
      // return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ ids: [...store] });
  }

  if (req.method === 'POST') {
    const { action, id, password } = req.body || {};
    if (password !== process.env.PANEL_PASSWORD) {
      return res.status(403).json({ error: 'Sai PANEL_PASSWORD' });
    }
    if (!id || !/^\d{15,25}$/.test(id)) return res.status(400).json({ error: 'ID không hợp lệ' });
    if (action === 'add') store.add(id);
    if (action === 'remove') store.delete(id);
    return res.status(200).json({ ok: true, ids: [...store] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
