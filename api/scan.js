const PROMPT='Ini foto laporan penjualan atau nota barang elektronik. Baca setiap baris barang dan kembalikan HANYA array JSON, tanpa teks lain: [{"barcode":"2002514","item":"DISPENSER SANKEN HWD-C500E","qty":31}]. Barcode berupa angka saja. Salin nama item persis seperti tertulis. Qty berupa angka. Abaikan baris Total, judul, dan header. Lewati baris yang tidak terbaca daripada menebak.';

// Model bisa diganti lewat Environment Variable GEMINI_MODEL tanpa mengubah kode
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });

  // PIN sederhana supaya orang lain tidak bisa memakai kuota API Anda
  const pin = process.env.APP_PIN;
  if (pin && req.headers['x-pin'] !== pin) return res.status(401).json({ error: { message: 'PIN salah' } });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: { message: 'GEMINI_API_KEY belum diset di Vercel' } });

  const image = req.body && req.body.image;
  if (!image) return res.status(400).json({ error: { message: 'Gambar tidak ada' } });

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [
          { inline_data: { mime_type: 'image/jpeg', data: image } },
          { text: PROMPT }
        ] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192, temperature: 0 }
      })
    });
    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      const msg = (j.error && j.error.message) || ('HTTP ' + r.status);
      // 400/403 dari Google biasanya berarti key salah atau model tidak tersedia: masalah server, bukan PIN user
      return res.status([400, 401, 403].includes(r.status) ? 500 : r.status).json({ error: { message: msg } });
    }

    const cand = j.candidates && j.candidates[0];
    const text = ((cand && cand.content && cand.content.parts) || []).map(p => p.text || '').join('');
    if (!text) {
      const why = (j.promptFeedback && j.promptFeedback.blockReason) || (cand && cand.finishReason) || 'kosong';
      return res.status(502).json({ error: { message: 'Tidak ada hasil dari Gemini (' + why + ')' } });
    }

    // Dibungkus dengan format {content:[{text}]} supaya script.js tidak perlu diubah
    res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (e) {
    res.status(502).json({ error: { message: 'Gagal menghubungi server AI' } });
  }
};
