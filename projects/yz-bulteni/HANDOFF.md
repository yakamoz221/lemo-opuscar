# HANDOFF — YZ Bülteni (yapay zekânın tarihi, dikey 2 dk)

Durum (19 Kasım 2026): görüntü, müzik/efekt miksi, gerçekler ve görseller hazır. Eksik olan tek şey seslendirme.

## Neler hazır
- Stil: Broadcast News Package (`styles/news-package`), 1080×1920, 24 fps, Türkçe.
- `TREATMENT.md`, `FACTS.md` (her sayı kaynaklı), `SOURCES.md` (5 Commons görseli, lisanslar kontrol edildi).
- `main.js` + `index.html`: tüm çekimler. Zamanlama `vo/dur.json`'dan otomatik kurulur (yoksa `vo/dur.est.json` tahmini kullanılır).
- `mix.py`: müzik (VSCO 2 CE / VCSL örnekleri), efektler, ses ducking. `events.json`'u okur.
- `vo/lines.json`: 18 satır; `text` = altyazı, `say` = seslendirilecek metin (sayılar yazıyla, isimler okunuşa göre).
- `tools/prep.py`: görselleri duotone'a çevirir. `tools/tl.py`: zaman çizelgesini yazdırır.

## Kalan adımlar
1. **Ses (ElevenLabs, kullanıcının seçimi):** her satırın `say` metnini bir Türkçe erkek haber sesiyle `vo/<id>.wav` olarak üret (multilingual model). Microsoft edge-tts ve Higgsfield kullanılmayacak (kullanıcı ElevenLabs istedi). Kapanış kartındaki "Ses:" satırını kullanılan sese göre güncelle (`main.js`, `shotEnd` → `CR[4]`).
2. `vo/dur.json` yaz: `{ "v1": saniye, ... }` (trim edilmiş wav süreleri). Toplam film ~2 dk olmalı; uzun gelirse hızı biraz artır.
3. `core/tts/asr_check.py vo/lines.json vo --lang tr` (gerekirse satırlara `asr` alanı).
4. Kütüphane kökünden (`$LIB`):
   - `node core/render/events.mjs <proje> --size 1080x1920`
   - `node core/render/readcheck.mjs <proje> --size 1080x1920`
   - `node core/render/video.mjs <proje> --size 1080x1920 --fps 24 --out <proje>/out/video.mp4`
   - `$LIB/.venv/bin/python <proje>/mix.py` (LIB ortam değişkeni)
   - `sh core/render/mux.sh <proje>/out/video.mp4 <proje>/out/mix.wav <proje>/yz-bulteni.mp4 24 2` (ffmpeg ≥ 7 gerekir)
5. `.srt`: `events.json` içindeki `vo` olaylarından (`t`, `d`, `text`) yaz; altyazı görüntüye basılmaz.
6. DIRECTOR.md §11 öz-denetimi, sonra MP4 + SRT teslim.
